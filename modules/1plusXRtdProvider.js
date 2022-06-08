import { submodule } from "../src/hook"
// Constants
const REAL_TIME_MODULE = 'realTimeData'
const MODULE_NAME = '1plusX'

// Functions

// Functions exported in submodule object
const init = (config, userConsent) => {
  // We prolly get the config again in getBidRequestData 
  return true;
}

const getBidRequestData = (reqBidsConfigObj, callback, config, userConsent) => { }

// The RTD submodule object to be exported
export const onePlusXSubmodule = {
  name: MODULE_NAME,
  init,
  getBidRequestData
}

// Register the onePlusXSubmodule as submodule of realTimeData
submodule(REAL_TIME_MODULE, MODULE_NAME);