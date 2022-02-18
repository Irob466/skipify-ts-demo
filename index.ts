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
