import { is, SAGA_ACTION } from 'redux-saga/utils'
import moment from 'moment';
import {
  EVENT_SOURCE,
  EFFECT_TRIGGERED,
  EFFECT_RESOLVED,
  EFFECT_REJECTED,
  EFFECT_CANCELLED,
  ACTION_DISPATCHED
} from '../constants';

function getTime() {
    if (performance && performance.now) {
        //return performance.now()
      return moment();
    } else {
      return moment(); //Date.now()
    }
}

function postToContent(action) {
  console.log('console: action-action', action);
    try {
        window.postMessage({
            source: EVENT_SOURCE,
            action: serialize(action)
        }, "*");
    } catch (e) {
        console.error(e);
    }
}

export function createSagaRelayMonitor() {
    function effectTriggered(effect) {
        postToContent({
            type: EFFECT_TRIGGERED,
            effect,
            name: 'effectTriggered',
            time: getTime()
        })
    }

    function effectResolved(effectId, result) {
        if (is.task(result)) {
            result.done.then(
                taskResult => {
                    if (result.isCancelled())
                        effectCancelled(effectId)
                    else
                        effectResolved(effectId, taskResult)
                },
                taskError => {
                    effectRejected(effectId, taskError)
                }
            )
        } else {
          const e = new Error();
          console.log('console: 9999999999', e.trace);
            const action = {
                type: EFFECT_RESOLVED,
                effectId,
                result,
                name: 'effectResolved',
                time: getTime()
            }
            postToContent(action)
        }
    }

    function effectRejected(effectId, error) {
        const action = {
            type: EFFECT_REJECTED,
            effectId,
            error,
            name: 'effectRejected',
            time: getTime()
        }
        postToContent(action)
    }

    function effectCancelled(effectId) {
        const action = {
            type: EFFECT_CANCELLED,
            effectId,
            name: 'effectCancelled',
            time: getTime()
        }
        postToContent(action)
    }


    function actionDispatched(action) {
        const isSagaAction = action[SAGA_ACTION]
        const now = getTime();
        postToContent({
            type: ACTION_DISPATCHED,
            id: now,
            action,
            isSagaAction,
            name: 'actionDispatched',
            time: now
        })
    }

    return {
        effectTriggered, effectResolved, effectRejected, effectCancelled, actionDispatched
    };
}

function mapKeysDeep(object, cb) {
    mapValues(
        mapKeys(obj, cb),
        val => (_.isObject(val) ? mapKeysDeep(val, cb) : val),
    )
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
    }
    catch (e) {
        if (e.message.indexOf("circular") >= 0) {
            return "[CIRCULAR OBJECT]";
        }
    }
}