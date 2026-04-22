# Infrastructure

## Source location
`~/.openclaw/workspace/forge-builder/` (resolves to `/Volumes/Iron 1TBSSD/OpenClaw-Workspace/forge-builder/`)

## Durable storage
`/Volumes/Iron 1TBSSD/Apps/ForgeBuilder/` — symlinked as `projects/` from source.
See `../Apps/ForgeBuilder/README.md` for layout.

## Launcher
- **macOS .app:** `~/Desktop/Forge Builder.app`
- **Shell launcher:** `/Volumes/Iron 1TBSSD/Apps/ForgeBuilder/launch.sh`
- **Stop:** `/Volumes/Iron 1TBSSD/Apps/ForgeBuilder/stop.sh`

## Publish targets (for demo project)
- GitHub: `essentialbit/forge-builder-demo@main`
- Netlify: `forge-builder-demo.netlify.app` (id `bd37d9de-6c54-490d-84f3-bd03e0dcbe7a`)

## Tokens (in `.env.local`, gitignored)
- `GITHUB_TOKEN` — Classic PAT with full repo scope (see workspace TOOLS.md)
- `NETLIFY_TOKEN` — personal access token

## Dev server
- Port: 3131
- Log: `/Volumes/Iron 1TBSSD/Apps/ForgeBuilder/logs/forge-builder-YYYYMMDD.log`
- PID: `/Volumes/Iron 1TBSSD/Apps/ForgeBuilder/forge-builder.pid`
