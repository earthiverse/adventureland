import config from "config";
import { createSigner, createVerifier } from "fast-jwt";

const key = config.get("jwt.secret");
const expiresIn = config.get("jwt.expiresIn");

const signer = createSigner({ key, expiresIn });
const verifier = createVerifier({ key });

export { signer, verifier };
