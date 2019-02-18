import { createSagaRelayMonitor } from "./sagaMonitor";
const sagaMonitor = createSagaRelayMonitor();
window["__SAGATIMELINE__"] = sagaMonitor;