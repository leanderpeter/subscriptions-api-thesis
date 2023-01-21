import axios, { AxiosInstance } from "axios";
import HealthIndicator from "~/src/domain/types/health-indicator";

const DEFAULT_TIMEOUT = 5000;
const IP_WEBSITE_URL = "https://canhazip.com/";

export default class HttpHealthIndicator implements HealthIndicator {
  private readonly requestService: AxiosInstance;

  constructor() {
    this.requestService = axios.create({
      timeout: DEFAULT_TIMEOUT,
    });
  }

  async health(): Promise<string> {
    const res = await this.requestService.get(IP_WEBSITE_URL);
    return (res.data as string).trim();
  }
}
