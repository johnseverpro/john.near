import { context, logging, storage, PersistentDeque } from "near-sdk-as";

/**
 * showYouKnow is a
 * - "view" function (ie. does not alter state)
 * - that takes no parameters
 * - and returns nothing
 *
 * - it has the side effect of appending to the log
 */
export function showYouKnow(): void {
  logging.log("showYouKnow() was called");
}





/**
 * saveMyName is a
 * - "call" function (ie. alters state)
 * - that takes no parameters
 * - saves the sender account name to contract state
 * - and returns nothing
 *
 * - it has the side effect of appending to the log
 */
export function saveMyName(): void {
  logging.log("saveMyName() was called");

  storage.setString("sender", context.sender);
}

/**
 * saveMyMessage is a
 * - "call" function (ie. alters state)
 * - that takes no parameters
 * - saves the sender account name and message to contract state
 * - and returns nothing
 *
 * - it has the side effect of appending to the log
 */
export function saveMyMessage(message: string): bool {
  logging.log("saveMyMessage() was called");

  assert(message.length > 0, "Message can not be blank.");
  const messages = new PersistentDeque<string>("messages");
  messages.pushFront(context.sender + " says " + message);

  return true;
}

/**
 * getAllMessages is a
 * - "view" function (ie. does not alter state)
 * - that takes no parameters
 * - reads all recorded messages from contract state (this can become expensive!)
 * - and returns an array of messages if any are found, otherwise empty array
 *
 * - it has the side effect of appending to the log
 */
export function getAllMessages(): Array<string> {
  logging.log("getAllMessages() was called");

  const messages = new PersistentDeque<string>("messages");
  let results = new Array<string>();

  while (!messages.isEmpty) {
    results.push(messages.popBack());
  }

  return results;
}
