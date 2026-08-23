# Deployment to dago.lt/zodziai

The production site is a static SvelteKit build deployed by
`.github/workflows/deploy.yml`. A push to `main`, or a manual workflow run,
builds the site for `https://dago.lt/zodziai/` and synchronizes `build/` to
Hostinger over SSH.

## One-time Hostinger setup

1. Enable SSH access in hPanel. Hostinger commonly uses port `65002`; use the
   exact host, user, and port shown in hPanel.
2. Add the public half of a dedicated deployment key to the hosting account's
   authorized SSH keys. The workflow requires a non-interactive private key.
3. Create the directory that will serve `https://dago.lt/zodziai/`. Its full
   server path must end in `/zodziai`.
4. Inside that directory, create an empty safety marker named
   `.deploy-marker-zodziai`:

   ```bash
   touch /full/path/to/zodziai/.deploy-marker-zodziai
   ```

The workflow will not run `rsync --delete` unless this marker is present. It
also preserves the marker and any `.well-known/` directory during deployment.

## GitHub production environment

In the repository, open **Settings -> Environments -> production** and add
these environment secrets. The names intentionally match the `dago-homepage`
deployment:

| Secret | Value |
| --- | --- |
| `DEPLOY_SSH_KEY` | Private half of the dedicated deployment key |
| `SSH_HOST` | Hostinger SSH host or IP |
| `SSH_USER` | Hostinger SSH username |
| `SSH_PORT` | Hostinger SSH port, often `65002` |
| `SSH_KNOWN_HOSTS` | Pinned known-hosts entry for that host and port |
| `REMOTE_DIR` | Full remote path ending in `/zodziai`, with no trailing slash |

If both repositories deploy to the same Hostinger account, copy the five SSH
values from the `dago-homepage` production environment and set only this
repository's `REMOTE_DIR` to the new subdirectory.

Do not generate `SSH_KNOWN_HOSTS` blindly during a workflow run. Verify the
server fingerprint independently against Hostinger's SSH details, then store
the matching `known_hosts` line. A host migration should fail deployment until
the new fingerprint has been verified and the secret deliberately updated.

Optionally restrict the `production` environment to the `main` branch and add
a required reviewer. Environment secrets are not exposed until its protection
rules pass.

## First deployment

Configure the environment and create the marker before merging the deployment
workflow. After it lands on `main`, watch **Actions -> Deploy**. The job:

1. checks the application and public data;
2. builds with `BASE_PATH=/zodziai` and the production public URL;
3. verifies the marker over pinned-key SSH;
4. shows an `rsync` dry run and then synchronizes the generated files;
5. checks the live build ID, homepage, extensionless `/apie` route, and public
   data catalog.

The deployment deletes stale generated files only inside the marked directory.
To roll back, revert the responsible commit on `main`; the resulting push will
build and deploy the previous content.
