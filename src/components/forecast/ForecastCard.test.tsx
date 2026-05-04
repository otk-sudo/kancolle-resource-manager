import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForecastCard } from './ForecastCard'

describe('ForecastCard', () => {
  it('should display resource name', () => {
    // Arrange & Act
    render(
      <ForecastCard
        label="燃料"
        current={16000}
        target={350000}
        dailyAvg={1000}
        reachable={true}
        daysLeft={334}
        reachDate={new Date('2027-04-05')}
      />
    )

    // Assert
    expect(screen.getByText('燃料')).toBeInTheDocument()
  })

  it('should display days left and reach date when reachable', () => {
    // Arrange & Act
    render(
      <ForecastCard
        label="燃料"
        current={16000}
        target={350000}
        dailyAvg={1000}
        reachable={true}
        daysLeft={334}
        reachDate={new Date('2027-04-05')}
      />
    )

    // Assert
    expect(screen.getByText(/334日後/)).toBeInTheDocument()
    expect(screen.getByText(/2027-04-05/)).toBeInTheDocument()
  })

  it('should display 到達不可 when not reachable', () => {
    // Arrange & Act
    render(
      <ForecastCard
        label="燃料"
        current={16000}
        target={350000}
        dailyAvg={-100}
        reachable={false}
        daysLeft={null}
        reachDate={null}
      />
    )

    // Assert
    expect(screen.getByText('到達不可')).toBeInTheDocument()
  })

  it('should display daily average', () => {
    // Arrange & Act
    render(
      <ForecastCard
        label="燃料"
        current={16000}
        target={350000}
        dailyAvg={1000}
        reachable={true}
        daysLeft={334}
        reachDate={new Date('2027-04-05')}
      />
    )

    // Assert — 1日平均が表示される
    expect(screen.getByText(/\+1,000|1000/)).toBeInTheDocument()
  })

  it('should display already reached when daysLeft is 0', () => {
    // Arrange & Act
    render(
      <ForecastCard
        label="燃料"
        current={350000}
        target={350000}
        dailyAvg={1000}
        reachable={true}
        daysLeft={0}
        reachDate={new Date()}
      />
    )

    // Assert
    expect(screen.getByText(/達成済み/)).toBeInTheDocument()
  })
})
