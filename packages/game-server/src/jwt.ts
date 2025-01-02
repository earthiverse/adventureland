import config from "config";
import { createVerifier } from "fast-jwt";

const key = config.get("jwt.secret");

const verifier = createVerifier({ key });

export { verifier };
