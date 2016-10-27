
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';

import express from 'express';
import compression from 'compression';
import path from 'path';
import React from 'react';
import RouterContext from 'react-router/lib/RouterContext';
import createMemoryHistory from 'react-router/lib/createMemoryHistory';
import match from 'react-router/lib/match';
import fs from 'fs';

import configureStore from '../redux/store';

import template from './template';
import routes from '../routes';

const clientAssets = require(KYT.ASSETS_MANIFEST); // eslint-disable-line import/no-dynamic-require
const app = express();

// Remove annoying Express header addition.
app.disable('x-powered-by');

// Compress (gzip) assets in production.
app.use(compression());

// Setup the public directory so that we can serve static assets.
app.use(express.static(path.join(process.cwd(), KYT.PUBLIC_DIR)));

// we get these from memory via webpack in DEV mode
let css = '';
let manifest = '';
if (process.env.NODE_ENV === 'production') {
  // Inline our CSS
  css = Object.keys(clientAssets)
        .filter(a => !!clientAssets[a].css)
        .map(a => fs.readFileSync(path.join(__dirname, '../public', clientAssets[a].css), 'utf8'))
        .join('\n');


  // Inline our manifest bundle mapping for performance reasons
  // (since it'll always be relatively small, better to save the rounddtrip)
  manifest = Object.keys(clientAssets)
        .filter(a => a === 'manifest')
        .map(a => fs.readFileSync(path.join(__dirname, '../public', clientAssets[a].js), 'utf8'))
        .reduce(a => a);
}

// Entry bundles (we only have 2: '0_vendor' and 'main')
const entries = Object.keys(clientAssets)
        .sort() // order matters, need "0_vendor" bundle to go first
        .filter(a => a === '0_vendor' || a === 'main')
        .map(a => clientAssets[a].js);

// Setup server side routing.
app.use((request, response) => {
  const history = createMemoryHistory(request.originalUrl);

  match({ routes, history }, (error, redirectLocation, renderProps) => {
    if (error) {
      response.status(500).send(error.message);
    } else if (redirectLocation) {
      response.redirect(302, `${redirectLocation.pathname}${redirectLocation.search}`);
    } else if (renderProps) {
      const store = configureStore();

      // Grab the initial state from our Redux store
      const initialState = JSON.stringify(store.getState());

      // When a React Router route is matched then we render
      // the components and assets into the template.
      response.status(200).send(template({
        root: renderToString(
          <Provider store={store}>
            <RouterContext {...renderProps} />
          </Provider>
          ),
        css,
        manifest,
        entries,
        initialState,
      }));
    } else {
      response.status(404).send('Not found');
    }
  });
});

app.listen(parseInt(KYT.SERVER_PORT, 10));

