# Vesuvius Challenge Segment Browser Frontend

This is the new frontend for the Vesuvius Challenge Segment Browser. It is currently deployed at
https://vesuvius.virtual-void.net/v2/.

It needs a backend server to provide the data. The backend server is currently running at
https://vesuvius.virtual-void.net/api/ and its source code is available at https://github.com/jrudolph/vesuvius-browser.

## Development

Install the dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Browse to http://localhost:5173 to see the frontend. Any changes to the source code will be automatically reloaded.

For development, you can configure the vite proxy in `vite.config.ts` to point to a local backend server. The
default configuration will use the public API and resources at https://vesuvius.virtual-void.net/.

The frontend project setup is based on Cláudio Silva's https://github.com/claudio-silva/claude-artifact-runner (MIT License).
See LICENSE.claude-artifact-runner for more information.
