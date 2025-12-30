## Commands

```bash
pnpm build               # builds simple-wire, create-simple-wire, and starter-template in order
pnpm create-simple-wire  # builds create-simple-wire and runs it in parent directory to test create-simple-wire locally
pnpm clean               # clean all packages
pnpm dev                 # runs simple-wire and starter-template in dev mode with hot-reloading

pnpm publish:simple-wire         # publishes simple-wire package

# Update SIMPLE_WIRE_VERSION in create-simple-wire src/index.ts before running:
pnpm publish:create-simple-wire  # publishes create-simple-wire package
```


# Create Simple Wire Application
```bash
npx create-simple-wire@latest
pnpm create simple-wire@latest
```