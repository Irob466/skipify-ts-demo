import "whatwg-fetch";
import axios from "axios";

/** basic typing */

// types are declared at initialization time with a colon and then the type:
let x: number;

// uncommenting the next line will give you a compiler error:
// x = "1";

// this assignment is valid
x = 1;

// this function is invalid because a number + string => string.
// to fix the compiler error, you need to change the function signature.
function sum(a: number, b: string): number {
  return a + b;
}

// typescript is duck-typed so you don't need to declare a type if it can be inferred. if you're in VSCode hover
// over each of these variables and check out the type.
let myBool = false;
let myNum = 5;
let myStr = "hello";
let myObj = { hello: "world" };

/** a primer on the `any` type */

// using the `any` type takes any compile-time errors and moves them to the runtime. it is functionally equivalent
// to writing plain Javascript. sometimes you may need `any` as a crutch but it should be used sparingly and is a
// candidate for refactoring before merging your code

// an example of using `any` to make a compile-time error into a runtime error
function compileTimeError(): string {
  // Number.prototype.toFixed() does not exist on string, so this code would fail on runtime when calling .toFixed().
  // however, we've caught this pre-compilation and can fix accordingly
  let n: number;
  n = "1"; // change this to n = 1 and we're good to go!
  return n.toFixed();
}

// this function compiles. yay! but if you try to run it you get a nasty runtime error because `typeof n` is `string` and
// String.prototype.toFixed() does not exist. all `n as number` does is tell the compiler that you as the developer trust that
// `n` is a number and can be used like a number safely (which it cannot, in this instance).
// a more complex compiler might be able to catch something like this but ultimately, using `any` comes with a cost in runtime
function runTimeError(): string {
  let n: any;
  n = "1";
  return (n as number).toFixed();
}

/** interface demo */

// a basic model from your application might look like this
type User = {
  name: string;
  email: string;
  // array types can be declared with type[] or Array<type> where type = the type of all members of the array.
  //   tags: string[];
  //   tags: Array<string>;
  // you can also reference a type within the type definition. this is valid:
  //   friends: User[];
};

// a simple type declaration for key, value pairs might look like { [key: string]: string }
// Record<string, string> is a convenience type provided by Typescript to make that declaration more readable.
type RestOptions = {
  headers?: Record<string, string>;
  mode?: "cors" | "no-cors" | "same-origin";
  cache?: "default" | "no-store" | "reload" | "no-cache" | "force-cache";
};

// an interface allows you to define what a class should be able to do without providing an implementation,
// that way you can utilize the interface regardless of the implementation.

// this is an interface that says the implementation must require a function called get that accepts a <string>
// and optional <RestOptions> and returns a Promise containing a User.
interface IRest {
  get: (path: string, opts?: RestOptions) => Promise<User>;
  post: (
    path: string,
    body: object | string,
    opts?: RestOptions
  ) => Promise<User>;
}

// implementing the Rest interface using fetch as the http library
class FetchRest implements IRest {
  get(path: string, opts: RestOptions = {}): Promise<User> {
    const init: RequestInit = {
      headers: opts.headers,
      mode: opts.mode,
      cache: opts.cache,
      method: "GET",
    };

    // NOTE: `res.json() as Promise<User>` does NOT do any runtime typechecking. If you need to verify
    // that the data coming from the server is a User, that must be done using Javascript, Typescript
    // offers no guarantees in this domain.
    return fetch(path, init).then((res) => res.json() as Promise<User>);
  }

  post(
    path: string,
    body: object | string,
    opts: RestOptions = {}
  ): Promise<User> {
    const init: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...opts.headers,
      },
      mode: opts.mode,
      cache: opts.cache,
      method: "POST",
    };
    let bodyJson: string;
    if (typeof body === "object") {
      bodyJson = JSON.stringify(body);
    } else {
      bodyJson = body;
    }
    init.body = bodyJson;
    return fetch(path, init).then((res) => res.json() as Promise<User>);
  }
}

// and now the Axios implementation, where many of the concerns have been taken care of
// NOTE: this implementation has issues. Axios doesn't know what to do with the `mode` or `cache` options
//       Typescript will _not_ help you uncover this unless you dig into Axios' <AxiosRequestConfig> type
class AxiosRest implements IRest {
  get(path: string, opts?: RestOptions): Promise<User> {
    // notice here that I passed in a generic to `axios.get`. This helps axios determine the type of `res.data`
    return axios.get<User>(path, opts).then((res) => res.data);
  }
  post(path: string, body: string | object, opts?: RestOptions): Promise<User> {
    return axios.post<User>(path, body, opts).then((res) => res.data);
  }
}

// we can now use this interface when building an application, upon initializing the app,
// we can provide either the fetch or the axios implementation and as long as the implementations
// are not buggy, we have the ability to call a `rest.get(path, opts)` or `rest.post(path, body, opts)`
// and get back a User object.
class App {
  rest: IRest;
  constructor(rest: IRest) {
    this.rest = rest;
  }

  login(username: string, password: string): Promise<User> {
    return this.rest.post("/login", { username, password });
  }

  me(): Promise<User> {
    return this.rest.get("/me");
  }
}

// examples of interoperability below:
const username = "test@skipify.com";
const password = "password";

const fetchApp = new App(new FetchRest());
const axiosApp = new App(new AxiosRest());

// due to the function signature of `login` you get intellisense on the `.then` callback for a User type.
fetchApp.login(username, password).then((u) => console.log(u.email));
