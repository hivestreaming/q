// Type definitions for Q-Hive 2.0.0, wrappers for ES6 promises
// Original project: https://github.com/kriskowal/q
// Original definitions by: Barrie Nemetchek <https://github.com/bnemetchek>
//                 Andrew Gaspar <https://github.com/AndrewGaspar>
//                 John Reilly <https://github.com/johnnyreilly>
//                 Michel Boudreau <https://github.com/mboudreau>
//                 TeamworkGuy2 <https://github.com/TeamworkGuy2>
// Original definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3

export = Q;
export as namespace Q;

/**
 * If value is a Q promise, returns the promise.
 * If value is not a promise, returns a promise that is fulfilled with value.
 */
declare function Q<T>(promise: PromiseLike<T> | T): Q.Promise<T>;
/**
 * Calling with nothing at all creates a void promise
 */
declare function Q(): Q.Promise<void>;

declare namespace Q {
	export type IWhenable<T> = PromiseLike<T> | T;
	export type IPromise<T> = PromiseLike<T>;

	export interface Deferred<T> {
		promise: Promise<T>;

		/**
		 * Calling resolve with a pending promise causes promise to wait on the passed promise, becoming fulfilled with its
		 * fulfillment value or rejected with its rejection reason (or staying pending forever, if the passed promise does).
		 * Calling resolve with a rejected promise causes promise to be rejected with the passed promise's rejection reason.
		 * Calling resolve with a fulfilled promise causes promise to be fulfilled with the passed promise's fulfillment value.
		 * Calling resolve with a non-promise value causes promise to be fulfilled with that value.
		 */
		resolve(value?: IWhenable<T>): void;

		/**
		 * Calling reject with a reason causes promise to be rejected with that reason.
		 */
		reject(reason?: any): void;
	}

	export interface Promise<T> {
		/**
		 * The then method from the Promises/A+ specification, with an additional progress handler.
		 */
		then<U>(onFulfill?: ((value: T) => IWhenable<U>) | null, onReject?: ((error: any) => IWhenable<U>) | null): Promise<U>;
		then<U = T, V = never>(onFulfill?: ((value: T) => IWhenable<U>) | null, onReject?: ((error: any) => IWhenable<V>) | null): Promise<U | V>;
		/**
		 * Like a finally clause, allows you to observe either the fulfillment or rejection of a promise, but to do so
		 * without modifying the final value. This is useful for collecting resources regardless of whether a job succeeded,
		 * like closing a database connection, shutting a server down, or deleting an unneeded key from an object.
		 * finally returns a promise, which will become resolved with the same fulfillment value or rejection reason
		 * as promise. However, if callback returns a promise, the resolution of the returned promise will be delayed
		 * until the promise returned from callback is finished. Furthermore, if the returned promise rejects, that
		 * rejection will be passed down the chain instead of the previous result.
		 */
		finally(finallyCallback: () => any): Promise<T>;

		/**
		 * A sugar method, equivalent to promise.then(undefined, onRejected).
		 */
		catch<U>(onRejected: (reason: any) => IWhenable<U>): Promise<U>;

		/**
		 * Alias for catch() (for non-ES5 browsers)
		 */
		fail<U>(onRejected: (reason: any) => IWhenable<U>): Promise<U>;

		/**
		 * Much like then, but with different behavior around unhandled rejection. If there is an unhandled rejection,
		 * either because promise is rejected and no onRejected callback was provided, or because onFulfilled or onRejected
		 * threw an error or returned a rejected promise, the resulting rejection reason is thrown as an exception in a
		 * future turn of the event loop.
		 * This method should be used to terminate chains of promises that will not be passed elsewhere. Since exceptions
		 * thrown in then callbacks are consumed and transformed into rejections, exceptions at the end of the chain are
		 * easy to accidentally, silently ignore. By arranging for the exception to be thrown in a future turn of the
		 * event loop, so that it won't be caught, it causes an onerror event on the browser window, or an uncaughtException
		 * event on Node.js's process object.
		 * Exceptions thrown by done will have long stack traces, if Q.longStackSupport is set to true. If Q.onerror is set,
		 * exceptions will be delivered there instead of thrown in a future turn.
		 * The Golden Rule of done vs. then usage is: either return your promise to someone else, or if the chain ends
		 * with you, call done to terminate it. Terminating with catch is not sufficient because the catch handler may
		 * itself throw an error.
		 */
		done(onFulfilled?: ((value: T) => any) | null, onRejected?: ((reason: any) => any) | null): void;

		/**
		 * Returns a promise that will have the same result as promise, except that if promise is not fulfilled or rejected
		 * before ms milliseconds, the returned promise will be rejected with an Error with the given message. If message
		 * is not supplied, the message will be "Timed out after " + ms + " ms".
		 */
		timeout(ms: number, message?: string): Promise<T>;

		/**
		 * Returns a promise that will have the same result as promise, but will only be fulfilled or rejected after at least
		 * ms milliseconds have passed.
		 */
		delay(ms: number): Promise<T>;
	}

	export interface PromiseState<T> {
		state: "fulfilled" | "rejected" | "pending";
		value?: T;
		reason?: any;
	}

	/**
	 * Returns a "deferred" object with a:
	 * promise property
	 * resolve(value) method
	 * reject(reason) method
	 * notify(value) method
	 * makeNodeResolver() method
	 */
	export function defer<T>(): Deferred<T>;

	/**
	 * Calling resolve with a pending promise causes promise to wait on the passed promise, becoming fulfilled with its
	 * fulfillment value or rejected with its rejection reason (or staying pending forever, if the passed promise does).
	 * Calling resolve with a rejected promise causes promise to be rejected with the passed promise's rejection reason.
	 * Calling resolve with a fulfilled promise causes promise to be fulfilled with the passed promise's fulfillment value.
	 * Calling resolve with a non-promise value causes promise to be fulfilled with that value.
	 */
	export function resolve<T>(object?: IWhenable<T>): Promise<T>;

	/**
	 * Returns a promise that is rejected with reason.
	 */
	export function reject<T>(reason?: any): Promise<T>;

	/**
	 * Returns a promise that is fulfilled with an array containing the fulfillment value of each promise, or is rejected with the same rejection reason as the first promise to be rejected.
	 */
	export function all<A, B, C, D, E, F>(promises: IWhenable<[IWhenable<A>, IWhenable<B>, IWhenable<C>, IWhenable<D>, IWhenable<E>, IWhenable<F>]>): Promise<[A, B, C, D, E, F]>;
	/**
	 * Returns a promise that is fulfilled with an array containing the fulfillment value of each promise, or is rejected with the same rejection reason as the first promise to be rejected.
	 */
	export function all<A, B, C, D, E>(promises: IWhenable<[IWhenable<A>, IWhenable<B>, IWhenable<C>, IWhenable<D>, IWhenable<E>]>): Promise<[A, B, C, D, E]>;
	/**
	 * Returns a promise that is fulfilled with an array containing the fulfillment value of each promise, or is rejected with the same rejection reason as the first promise to be rejected.
	 */
	export function all<A, B, C, D>(promises: IWhenable<[IWhenable<A>, IWhenable<B>, IWhenable<C>, IWhenable<D>]>): Promise<[A, B, C, D]>;
	/**
	 * Returns a promise that is fulfilled with an array containing the fulfillment value of each promise, or is rejected with the same rejection reason as the first promise to be rejected.
	 */
	export function all<A, B, C>(promises: IWhenable<[IWhenable<A>, IWhenable<B>, IWhenable<C>]>): Promise<[A, B, C]>;
	/**
	 * Returns a promise that is fulfilled with an array containing the fulfillment value of each promise, or is rejected with the same rejection reason as the first promise to be rejected.
	 */
	export function all<A, B>(promises: IWhenable<[IPromise<A>, IPromise<B>]>): Promise<[A, B]>;
	export function all<A, B>(promises: IWhenable<[A, IPromise<B>]>): Promise<[A, B]>;
	export function all<A, B>(promises: IWhenable<[IPromise<A>, B]>): Promise<[A, B]>;
	export function all<A, B>(promises: IWhenable<[A, B]>): Promise<[A, B]>;
	/**
	 * Returns a promise that is fulfilled with an array containing the fulfillment value of each promise, or is rejected with the same rejection reason as the first promise to be rejected.
	 */
	export function all<T>(promises: IWhenable<Array<IWhenable<T>>>): Promise<T[]>;

	/**
	 * Returns a promise for the first of an array of promises to become settled.
	 */
	export function race<T>(promises: Array<IWhenable<T>>): Promise<T>;

	/**
	 * Returns a promise that is fulfilled with an array of promise state snapshots, but only after all the original promises
	 * have settled, i.e. become either fulfilled or rejected.
	 */
	export function allSettled<T>(promises: IWhenable<Array<IWhenable<T>>>): Promise<Array<PromiseState<T>>>;

	/**
	 * Returns a promise that will have the same result as promise, except that if promise is not fulfilled or rejected
	 * before ms milliseconds, the returned promise will be rejected with an Error with the given message. If message
	 * is not supplied, the message will be "Timed out after " + ms + " ms".
	 */
	export function timeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T>;

	/**
	 * Returns a promise that will have the same result as promise, but will only be fulfilled or rejected after at least ms milliseconds have passed.
	 */
	export function delay<T>(promiseOrValue: Promise<T> | T, ms: number): Promise<T>;

	/**
	 * Returns a promise that will be fulfilled with undefined after at least ms milliseconds have passed.
	 */
	export function delay(ms: number): Promise<void>;

	 /**
	 * Synchronously calls resolver(resolve, reject, notify) and returns a promise whose state is controlled by the
	 * functions passed to resolver. This is an alternative promise-creation API that has the same power as the deferred
	 * concept, but without introducing another conceptual entity.
	 * If resolver throws an exception, the returned promise will be rejected with that thrown exception as the rejection reason.
	 * note: In the latest github, this method is called Q.Promise, but if you are using the npm package version 0.9.7
	 * or below, the method is called Q.promise (lowercase vs uppercase p).
	 */
	export function Promise<T>(resolver: (resolve: (val?: IWhenable<T>) => void, reject: (reason?: any) => void) => void): Promise<T>;


	/**
	 * Resets the global "Q" variable to the value it has before Q was loaded.
	 * This will either be undefined if there was no version or the version of Q which was already loaded before.
	 * @returns The last version of Q.
	 */
	export function noConflict(): typeof Q;
}
