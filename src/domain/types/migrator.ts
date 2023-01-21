export default interface Migrator {
  applyMigrations: () => Promise<string>;
}
