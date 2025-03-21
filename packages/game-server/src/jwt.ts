import config from "config";
import { createSigner, createVerifier } from "fast-jwt";

const key = config.get("jwt.secret");

const signer = createSigner({ key });
const verifier = createVerifier({ key });

export { signer, verifier };
