import {describe, it, beforeEach, afterEach, expect, vi} from "vitest";
import {scheduleCallback, NormalPriority} from "../index";

let global: {
  performance?: any;
  setTimeout?: any;
  clearTimeout?: any;
  MessageChannel?: any;
} = {};
let runtime;
describe("任务", () => {
  function installMockBrowserRuntime() {
    let hasPendingMessageEvent = false;
    let isFiringMessageEvent = false;
    let hasPendingDiscreteEvent = false;
    let hasPendingContinuousEvent = false;

    let timerIDCounter = 0;
    // let timerIDs = new Map();

    let eventLog: Array<T> = [];

    let currentTime = 0;

    global.performance = {
      now() {
        return currentTime;
      },
    };

    global.setTimeout = (cb, delay) => {
      const id = timerIDCounter++;
      log(`Set Timer`);
      // TODO
      return id;
    };
    global.clearTimeout = (id) => {
      // TODO
    };

    const port1: any = {};
    const port2 = {
      postMessage() {
        if (hasPendingMessageEvent) {
          throw Error("Message event already scheduled");
        }
        log("Post Message");
        hasPendingMessageEvent = true;
      },
    };
    global.MessageChannel = function MessageChannel() {
      this.port1 = port1;
      this.port2 = port2;
    };

    const scheduling = {
      isInputPending(options) {
        if (this !== scheduling) {
          throw new Error(
            "isInputPending called with incorrect `this` context"
          );
        }

        return (
          hasPendingDiscreteEvent ||
          (options && options.includeContinuous && hasPendingContinuousEvent)
        );
      },
    };

    function ensureLogIsEmpty() {
      if (eventLog.length !== 0) {
        throw Error("Log is not empty. Call assertLog before continuing.");
      }
    }
    function advanceTime(ms) {
      currentTime += ms;
    }
    function resetTime() {
      currentTime = 0;
    }
    function fireMessageEvent() {
      ensureLogIsEmpty();
      if (!hasPendingMessageEvent) {
        throw Error("No message event was scheduled");
      }
      hasPendingMessageEvent = false;
      const onMessage = port1.onmessage;
      log("Message Event");

      isFiringMessageEvent = true;
      try {
        onMessage();
      } finally {
        isFiringMessageEvent = false;
        if (hasPendingDiscreteEvent) {
          log("Discrete Event");
          hasPendingDiscreteEvent = false;
        }
        if (hasPendingContinuousEvent) {
          log("Continuous Event");
          hasPendingContinuousEvent = false;
        }
      }
    }
    function scheduleDiscreteEvent() {
      if (isFiringMessageEvent) {
        hasPendingDiscreteEvent = true;
      } else {
        log("Discrete Event");
      }
    }
    function scheduleContinuousEvent() {
      if (isFiringMessageEvent) {
        hasPendingContinuousEvent = true;
      } else {
        log("Continuous Event");
      }
    }
    function log(val: any) {
      eventLog.push(val);
    }
    function isLogEmpty() {
      return eventLog.length === 0;
    }
    function assertLog(expected) {
      const actual = eventLog;
      eventLog = [];

      console.log(
        "%c [  ]-131",
        "font-size:13px; background:pink; color:#bf2c9f;",
        actual
      );
      expect(actual).toEqual(expected);
    }
    return {
      advanceTime,
      resetTime,
      fireMessageEvent,
      log,
      isLogEmpty,
      assertLog,
      scheduleDiscreteEvent,
      scheduleContinuousEvent,
    };
  }

  beforeEach(() => {
    vi.resetModules();
    runtime = installMockBrowserRuntime();
    // vi.unmock('scheduler');
  });

  afterEach(() => {
    delete global.performance;

    if (!runtime.isLogEmpty()) {
      throw Error("Test exited without clearing log.");
    }
  });

  it("task that finishes before deadline", () => {
    scheduleCallback(NormalPriority, () => {
      runtime.log("Task");
    });
    // runtime.assertLog(["Post Message"]);
    runtime.fireMessageEvent();
    // runtime.assertLog(["Message Event", "Task"]);
  });

  // it("task that finishes before deadline", () => {
  //   scheduleCallback(NormalPriority, () => {
  //     // runtime.log("Task");
  //   });
  //   // runtime.assertLog(["Post Message"]);
  //   // runtime.fireMessageEvent();
  //   // runtime.assertLog(["Message Event", "Task"]);
  // });
});
