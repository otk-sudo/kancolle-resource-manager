use bytes::Bytes;
use http_body_util::{combinators::BoxBody, BodyExt, Empty, Full};
use hyper::{body::Incoming, server::conn::http1, service::service_fn, Method, Request, Response, StatusCode};
use hyper_util::rt::TokioIo;
use once_cell::sync::Lazy;
use rcgen::{BasicConstraints, CertificateParams, DistinguishedName, DnType, IsCa, KeyPair};
use rustls::pki_types::{CertificateDer, PrivateKeyDer};
use std::{convert::Infallible, net::SocketAddr, path::PathBuf, sync::{Arc, Mutex}};
use tauri::{AppHandle, Emitter};
use tokio::{net::TcpListener, sync::oneshot};
use tokio_rustls::TlsAcceptor;

// ──────────────────────────────────────────────
// グローバル状態
// ──────────────────────────────────────────────

static PROXY_STOP: Lazy<Mutex<Option<oneshot::Sender<()>>>> = Lazy::new(|| Mutex::new(None));

// ──────────────────────────────────────────────
// 設定
// ──────────────────────────────────────────────

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ProxyConfig {
    pub port:          u16,
    pub upstream_host: Option<String>,
    pub upstream_port: Option<u16>,
}

impl Default for ProxyConfig {
    fn default() -> Self {
        Self { port: 8087, upstream_host: None, upstream_port: None }
    }
}

// ──────────────────────────────────────────────
// CA 証明書
// ──────────────────────────────────────────────

pub struct CaStore {
    pub cert_pem: String,
    pub key_pem:  String,
}

fn ca_paths(data_dir: &PathBuf) -> (PathBuf, PathBuf) {
    (data_dir.join("krm-ca.crt"), data_dir.join("krm-ca.key.pem"))
}

pub fn ensure_ca(data_dir: &PathBuf) -> Result<CaStore, String> {
    let (cert_path, key_path) = ca_paths(data_dir);

    if cert_path.exists() && key_path.exists() {
        let cert_pem = std::fs::read_to_string(&cert_path).map_err(|e| e.to_string())?;
        let key_pem  = std::fs::read_to_string(&key_path).map_err(|e| e.to_string())?;
        return Ok(CaStore { cert_pem, key_pem });
    }

    let key_pair = KeyPair::generate().map_err(|e| e.to_string())?;
    let mut params = CertificateParams::default();
    params.is_ca = IsCa::Ca(BasicConstraints::Unconstrained);
    let mut dn = DistinguishedName::new();
    dn.push(DnType::CommonName, "KanColle Resource Manager CA");
    dn.push(DnType::OrganizationName, "KRM");
    params.distinguished_name = dn;

    let cert = params.self_signed(&key_pair).map_err(|e| e.to_string())?;
    let cert_pem = cert.pem();
    let key_pem  = key_pair.serialize_pem();

    std::fs::create_dir_all(data_dir).map_err(|e| e.to_string())?;
    std::fs::write(&cert_path, &cert_pem).map_err(|e| e.to_string())?;
    std::fs::write(&key_path,  &key_pem).map_err(|e| e.to_string())?;

    Ok(CaStore { cert_pem, key_pem })
}

pub fn install_ca_cert(data_dir: &PathBuf) -> Result<(), String> {
    let (cert_path, _) = ca_paths(data_dir);
    if !cert_path.exists() {
        return Err("CA証明書が見つかりません。先にプロキシを起動してください。".into());
    }
    let status = std::process::Command::new("powershell")
        .args([
            "-Command",
            &format!(
                "Start-Process certutil -ArgumentList '-addstore','Root','{}' -Verb RunAs -Wait",
                cert_path.to_string_lossy()
            ),
        ])
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() { Ok(()) } else { Err("証明書のインストールに失敗しました。".into()) }
}

// ──────────────────────────────────────────────
// ホスト別証明書を動的生成
// ──────────────────────────────────────────────

fn make_tls_acceptor(hostname: &str, ca: &CaStore) -> Result<TlsAcceptor, String> {
    // CA の KeyPair を PEM から復元
    let ca_key = KeyPair::from_pem(&ca.key_pem).map_err(|e| e.to_string())?;

    // CA cert を同じパラメータで再生成（同じ鍵なので公開鍵は同一）
    let mut ca_params = CertificateParams::default();
    ca_params.is_ca = IsCa::Ca(BasicConstraints::Unconstrained);
    let mut dn = DistinguishedName::new();
    dn.push(DnType::CommonName, "KanColle Resource Manager CA");
    dn.push(DnType::OrganizationName, "KRM");
    ca_params.distinguished_name = dn;
    let ca_cert = ca_params.self_signed(&ca_key).map_err(|e| e.to_string())?;

    // サーバー証明書を動的生成
    let server_key = KeyPair::generate().map_err(|e| e.to_string())?;
    let server_params = CertificateParams::new(vec![hostname.to_string()])
        .map_err(|e| e.to_string())?;
    let server_cert = server_params
        .signed_by(&server_key, &ca_cert, &ca_key)
        .map_err(|e| e.to_string())?;

    let cert_chain = vec![CertificateDer::from(server_cert.der().to_vec())];
    let key = PrivateKeyDer::try_from(server_key.serialize_der())
        .map_err(|e| e.to_string())?;

    let tls_cfg = rustls::ServerConfig::builder()
        .with_no_client_auth()
        .with_single_cert(cert_chain, key)
        .map_err(|e| e.to_string())?;

    Ok(TlsAcceptor::from(Arc::new(tls_cfg)))
}

// ──────────────────────────────────────────────
// reqwest クライアント（上流プロキシ対応）
// ──────────────────────────────────────────────

fn make_client(config: &ProxyConfig) -> reqwest::Client {
    let mut builder = reqwest::Client::builder()
        .use_rustls_tls();

    if let (Some(host), Some(port)) = (&config.upstream_host, config.upstream_port) {
        if let Ok(proxy) = reqwest::Proxy::all(format!("http://{}:{}", host, port)) {
            builder = builder.proxy(proxy);
        }
    }

    builder.build().unwrap_or_default()
}

// ──────────────────────────────────────────────
// kcsapi 解析・イベント送信
// ──────────────────────────────────────────────

fn parse_svdata(body: &[u8]) -> Option<serde_json::Value> {
    let text = std::str::from_utf8(body).ok()?;
    serde_json::from_str(text.strip_prefix("svdata=")?).ok()
}

fn emit_kcsapi(app: &AppHandle, path: &str, data: serde_json::Value) {
    let seg = path.split('/').last().unwrap_or("unknown").replace('_', "-");
    let _ = app.emit(&format!("kcsapi-{seg}"), data);
}

// ──────────────────────────────────────────────
// ボディ変換ユーティリティ
// ──────────────────────────────────────────────

fn empty_body() -> BoxBody<Bytes, hyper::Error> {
    Empty::<Bytes>::new().map_err(|e| match e {}).boxed()
}
fn full_body(b: impl Into<Bytes>) -> BoxBody<Bytes, hyper::Error> {
    Full::new(b.into()).map_err(|e| match e {}).boxed()
}

// ──────────────────────────────────────────────
// プレーン HTTP 転送
// ──────────────────────────────────────────────

async fn forward_http(
    req: Request<Incoming>,
    client: &reqwest::Client,
    app: &AppHandle,
) -> Result<Response<BoxBody<Bytes, hyper::Error>>, Box<dyn std::error::Error + Send + Sync>> {
    let path = req.uri().path().to_string();
    let is_kcsapi = path.contains("/kcsapi/");
    let method = reqwest::Method::from_bytes(req.method().as_str().as_bytes())?;
    let url = req.uri().to_string();

    let mut rb = client.request(method, &url);
    for (k, v) in req.headers() {
        rb = rb.header(k.as_str(), v.to_str().unwrap_or(""));
    }
    let body_bytes = req.into_body().collect().await?.to_bytes();
    rb = rb.body(body_bytes);

    let resp = rb.send().await?;
    let status = resp.status().as_u16();
    let mut builder = Response::builder().status(status);
    for (k, v) in resp.headers() {
        builder = builder.header(k.as_str(), v.to_str().unwrap_or(""));
    }
    let resp_bytes = resp.bytes().await?;

    if is_kcsapi {
        if let Some(json) = parse_svdata(&resp_bytes) {
            emit_kcsapi(app, &path, json);
        }
    }

    Ok(builder.body(full_body(resp_bytes))?)
}

// ──────────────────────────────────────────────
// HTTPS CONNECT ハンドラ（MITM）
// ──────────────────────────────────────────────

async fn handle_connect(
    req: Request<Incoming>,
    config: Arc<ProxyConfig>,
    ca: Arc<CaStore>,
    app: AppHandle,
) {
    let host_port = req.uri().authority().map(|a| a.as_str().to_string())
        .unwrap_or_default();
    let hostname: String = host_port.split(':').next().unwrap_or("").to_string();

    // MITM TLS acceptor
    let acceptor = match make_tls_acceptor(&hostname, &ca) {
        Ok(a) => a,
        Err(e) => { log::error!("TLS acceptor 生成失敗 {hostname}: {e}"); return; }
    };

    // hyper の upgrade で raw stream を取得
    let upgraded = match hyper::upgrade::on(req).await {
        Ok(u) => u,
        Err(e) => { log::error!("upgrade 失敗: {e}"); return; }
    };

    // ブラウザ ↔ プロキシ間を TLS に昇格
    let tls_stream = match acceptor.accept(TokioIo::new(upgraded)).await {
        Ok(s) => s,
        Err(e) => { log::error!("TLS accept 失敗 {hostname}: {e}"); return; }
    };

    // TLS ストリーム上で HTTP/1.1 を処理
    let client = make_client(&config);
    let hostname_clone = hostname.clone();
    let app_clone = app.clone();

    let svc = service_fn(move |req: Request<Incoming>| {
        let client = client.clone();
        let hostname = hostname_clone.clone();
        let app = app_clone.clone();

        async move {
            // 相対 URI → 絶対 URI に変換
            let path_and_query = req.uri().path_and_query()
                .map(|pq| pq.as_str())
                .unwrap_or("/")
                .to_string();
            let url = format!("https://{hostname}{path_and_query}");
            let is_kcsapi = path_and_query.contains("/kcsapi/");

            let method = reqwest::Method::from_bytes(req.method().as_str().as_bytes())
                .unwrap_or(reqwest::Method::GET);
            let mut rb = client.request(method, &url);
            for (k, v) in req.headers() {
                rb = rb.header(k.as_str(), v.to_str().unwrap_or(""));
            }
            let body_bytes = req.into_body().collect().await?.to_bytes();
            rb = rb.body(body_bytes);

            match rb.send().await {
                Ok(resp) => {
                    let status = resp.status().as_u16();
                    let mut builder = Response::builder().status(status);
                    for (k, v) in resp.headers() {
                        builder = builder.header(k.as_str(), v.to_str().unwrap_or(""));
                    }
                    let resp_bytes = resp.bytes().await.unwrap_or_default();

                    if is_kcsapi {
                        if let Some(json) = parse_svdata(&resp_bytes) {
                            emit_kcsapi(&app, &path_and_query, json);
                        }
                    }

                    Ok::<_, hyper::Error>(builder.body(full_body(resp_bytes)).unwrap())
                }
                Err(e) => {
                    log::error!("転送エラー {hostname}: {e}");
                    Ok(Response::builder().status(502).body(empty_body()).unwrap())
                }
            }
        }
    });

    if let Err(e) = http1::Builder::new()
        .serve_connection(TokioIo::new(tls_stream), svc)
        .with_upgrades()
        .await
    {
        log::debug!("MITM 接続終了 {hostname}: {e}");
    }
}

// ──────────────────────────────────────────────
// プロキシサービス（hyper が呼ぶエントリポイント）
// ──────────────────────────────────────────────

async fn proxy_service(
    req: Request<Incoming>,
    config: Arc<ProxyConfig>,
    ca: Arc<CaStore>,
    app: AppHandle,
    client: Arc<reqwest::Client>,
) -> Result<Response<BoxBody<Bytes, hyper::Error>>, Infallible> {
    if req.method() == Method::CONNECT {
        let config2 = config.clone();
        let ca2     = ca.clone();
        let app2    = app.clone();
        tokio::spawn(async move { handle_connect(req, config2, ca2, app2).await });

        return Ok(Response::builder()
            .status(StatusCode::OK)
            .body(empty_body())
            .unwrap());
    }

    match forward_http(req, &client, &app).await {
        Ok(r)  => Ok(r),
        Err(e) => {
            log::error!("HTTP 転送エラー: {e}");
            Ok(Response::builder().status(502).body(empty_body()).unwrap())
        }
    }
}

// ──────────────────────────────────────────────
// 起動・停止
// ──────────────────────────────────────────────

pub async fn start(config: ProxyConfig, ca: CaStore, app: AppHandle) -> Result<(), String> {
    let addr = SocketAddr::from(([127, 0, 0, 1], config.port));
    let listener = TcpListener::bind(addr).await
        .map_err(|e| format!("ポート {} のバインドに失敗: {}", config.port, e))?;

    let (tx, mut rx) = oneshot::channel::<()>();
    *PROXY_STOP.lock().unwrap() = Some(tx);

    let config = Arc::new(config);
    let ca     = Arc::new(ca);
    let client = Arc::new(make_client(&config));

    log::info!("プロキシ起動: {addr}");

    tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = &mut rx => { log::info!("プロキシ停止"); break; }
                result = listener.accept() => {
                    let Ok((stream, _)) = result else { continue };
                    let config = config.clone();
                    let ca     = ca.clone();
                    let app    = app.clone();
                    let client = client.clone();
                    tokio::spawn(async move {
                        let svc = service_fn(move |req| {
                            proxy_service(req, config.clone(), ca.clone(), app.clone(), client.clone())
                        });
                        if let Err(e) = http1::Builder::new()
                            .serve_connection(TokioIo::new(stream), svc)
                            .with_upgrades()
                            .await
                        {
                            log::debug!("接続エラー: {e}");
                        }
                    });
                }
            }
        }
    });

    Ok(())
}

pub fn stop() {
    if let Some(tx) = PROXY_STOP.lock().unwrap().take() {
        let _ = tx.send(());
    }
}

pub fn is_running() -> bool {
    PROXY_STOP.lock().unwrap().is_some()
}
