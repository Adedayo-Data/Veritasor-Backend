export class ValidationError extends Error {
  public status: number;
  public details: any[];

  constructor(details: any[]) {
    super("Validation Error");
    this.name = "ValidationError";
    this.status = 400;
    this.details = details;
  }
}
