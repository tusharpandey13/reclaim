// Hand-written: the shape of what scripts/gen-contract.mjs generates beside it.
export interface ValidateError {
  instancePath: string;
  message?: string;
}
export interface Validate {
  (data: unknown): boolean;
  errors?: ValidateError[] | null;
}
declare const validate: Validate;
export default validate;
