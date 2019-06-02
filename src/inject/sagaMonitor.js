import { is, SAGA_ACTION } from "redux-saga/utils";
import moment from "moment";
import {
  EVENT_SOURCE,
  EFFECT_TRIGGERED,
  EFFECT_RESOLVED,
  EFFECT_REJECTED,
  EFFECT_CANCELLED,
  ACTION_DISPATCHED
} from "../constants";

let effectIdGlobal = 1;

function getTime() {
  if (performance && performance.now) {
    //return performance.now()
    return moment();
  } else {
    return moment(); //Date.now()
  }
}

function postToContent(action) {
  try {
    window.postMessage(
      {
        source: EVENT_SOURCE,
        action: serialize(action)
      },
      "*"
    );
  } catch (e) {
    console.error(e);
  }
}

export function createSagaRelayMonitor() {
  function effectTriggered(effect) {
    console.log("console: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    postToContent({
      type: EFFECT_TRIGGERED,
      effect,
      name: "effectTriggered",
      time: getTime(),
      idx: effectIdGlobal - 2
    });
  }

  function effectResolved(effectId, result) {
    if (is.task(result)) {
      result.done.then(
        taskResult => {
          if (result.isCancelled()) effectCancelled(effectId);
          else effectResolved(effectId, taskResult);
        },
        taskError => {
          effectRejected(effectId, taskError);
        }
      );
    } else {
      const e = new Error();
      effectIdGlobal++;
      const action = {
        type: EFFECT_RESOLVED,
        effectId,
        result,
        name: "effectResolved",
        time: getTime(),
        idx: effectIdGlobal - 2
      };
      postToContent(action);
    }
  }

  function effectRejected(effectId, error) {
    effectIdGlobal++;
    const action = {
      type: EFFECT_REJECTED,
      effectId,
      error,
      name: "effectRejected",
      time: getTime(),
      idx: effectIdGlobal - 2
    };
    postToContent(action);
  }

  function effectCancelled(effectId) {
    effectIdGlobal++;
    const action = {
      type: EFFECT_CANCELLED,
      effectId,
      name: "effectCancelled",
      time: getTime(),
      idx: effectIdGlobal - 2
    };
    postToContent(action);
  }

  function actionDispatched(action) {
    effectIdGlobal = effectIdGlobal + 10;
    const isSagaAction = action[SAGA_ACTION];
    const now = getTime();
    postToContent({
      type: ACTION_DISPATCHED,
      idx: effectIdGlobal,
      action,
      isSagaAction,
      name: "actionDispatched",
      time: now
    });
  }

  return {
    effectTriggered,
    effectResolved,
    effectRejected,
    effectCancelled,
    actionDispatched
  };
}

function mapKeysDeep(object, cb) {
  mapValues(mapKeys(obj, cb), val =>
    _.isObject(val) ? mapKeysDeep(val, cb) : val
  );
}

function serialize(effect) {
  const fns = [];
  try {
    return JSON.stringify(effect, (key, value) => {
      if (typeof value === "function") {
        return { name: value.name };
      }

      if (key === "result") {
        return serialize(value);
      }

      if (value instanceof Error) {
        return {
          message: value.message,
          name: value.name,
          stack: value.stack
        };
      }
      return value;
    });
  } catch (e) {
    if (e.message.indexOf("circular") >= 0) {
      return "[CIRCULAR OBJECT]";
    }
  }
}
