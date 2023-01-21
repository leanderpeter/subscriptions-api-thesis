export default interface HealthIndicator {
  health: () => Promise<string | number>;
}
