import app from "./app.js";
import { port } from "./config/env.config.js";

app.listen(port, () => {
    console.log(`HTTP Wrapper running on port ${port}`);
});