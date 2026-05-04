import type { ChainStep, ImprovableEquipment, ImprovementPlan, ImprovementCost, Weekday } from '../types/improvement'

const ZERO_COST: ImprovementCost = {
  fuel: 0, ammo: 0, steel: 0, baux: 0,
  devMaterial: 0, improveMaterial: 0,
}

function addCost(a: ImprovementCost, b: ImprovementCost): ImprovementCost {
  return {
    fuel: a.fuel + b.fuel,
    ammo: a.ammo + b.ammo,
    steel: a.steel + b.steel,
    baux: a.baux + b.baux,
    devMaterial: a.devMaterial + b.devMaterial,
    improveMaterial: a.improveMaterial + b.improveMaterial,
  }
}

/**
 * 1ステップの残り改修コストを計算する（currentStar → targetStar）。
 */
export function calcRemainingCost(
  step: ChainStep,
  equipment: ImprovableEquipment,
): ImprovementCost {
  let total = { ...ZERO_COST }
  for (let i = step.currentStar; i < step.targetStar; i++) {
    total = addCost(total, equipment.costs[i] ?? ZERO_COST)
  }
  return total
}

/**
 * アクティブなプラン全体の残り改修コスト合計を計算する。
 */
export function calcWeeklyTotal(
  plans: ImprovementPlan[],
  equipments: ImprovableEquipment[],
): ImprovementCost {
  let total = { ...ZERO_COST }
  for (const plan of plans) {
    for (const step of plan.steps) {
      const eq = equipments.find(e => e.equipId === step.equipId)
      if (!eq) continue
      total = addCost(total, calcRemainingCost(step, eq))
    }
  }
  return total
}

/**
 * 指定曜日に改修可能な装備一覧を返す。
 */
export function getTodayAvailableEquips(
  equipments: ImprovableEquipment[],
  weekday: Weekday | number,
): ImprovableEquipment[] {
  return equipments.filter(eq => eq.secretaryByDay[weekday as Weekday] !== undefined)
}
