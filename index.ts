import "reflect-metadata";
import {
  makeRemoteExecutableSchema,
  introspectSchema,
  mergeSchemas
} from "graphql-tools";
import { HttpLink } from "apollo-link-http";
import { setContext } from "apollo-link-context";
import { ApolloServer } from "apollo-server";
import * as fetch from "isomorphic-fetch";
require("dotenv-safe").config({
  allowEmptyValues: true
});

const isBrowser = typeof window !== "undefined";

if (!isBrowser) {
  (global as any).fetch = fetch;
}

// Apollo link with the uri of GraphQL API
const link = new HttpLink({
  uri: "https://api.github.com/graphql",
  fetch
});

const gitHubLink = setContext(() => ({
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
  }
})).concat(link);

// create executable schemas from remote GraphQL API
const createRemoteExecutableSchema = async () => {
  const remoteSchema = await introspectSchema(gitHubLink);
  const remoteExecutableSchema = makeRemoteExecutableSchema({
    schema: remoteSchema,
    link: gitHubLink
  });
  return remoteExecutableSchema;
};

const createNewSchema = async () => {
  // get remote executable schema
  const schema = await createRemoteExecutableSchema();

  return mergeSchemas({
    schemas: [schema]
  });
};

const runServer = async () => {
  // Get newly merged schema
  const schema = await createNewSchema();
  // start server with the new schema
  const server = new ApolloServer({
    schema,
    playground: {
      settings: {
        "general.betaUpdates": false,
        "editor.cursorShape": "underline",
        "editor.fontSize": 20,
        "editor.fontFamily":
          "'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace",
        "editor.theme": "light",
        "editor.reuseHeaders": true,
        "prettier.printWidth": 80,
        "request.credentials": "omit",
        "tracing.hideTracingResponse": true
      }
    }
  });
  server.listen(4070).then(({ url }) => {
    console.log(`Running at ${url}`);
  });
};

try {
  runServer();
} catch (err) {
  console.error(err);
}
