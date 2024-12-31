import config from "config";
import { createSigner, createVerifier } from "fast-jwt";

const key = config.get("centralServer.jwt.secret");
const expiresIn = config.get("centralServer.jwt.expiresIn");

const signer = createSigner({ key, expiresIn });
const verifier = createVerifier({ key });

export { signer, verifier };
