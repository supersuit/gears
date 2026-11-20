# Deploying GEARS to Cloudflare

This branch moves the server parts off Netlify. The static site and the two
server routes run as one Cloudflare Worker, configured by `wrangler.jsonc`.
The browser code is unchanged because the routes keep their old paths.

## One-time setup

1. Create a Cloudflare account and install Node.js.
2. From the repo folder, log in: `npx wrangler login`.
3. Create the storage: `npx wrangler kv namespace create GEARS_STATE`.
   Copy the id it prints into `wrangler.jsonc` in place of `REPLACE_WITH_KV_NAMESPACE_ID`.
4. Set the secrets. Each command asks for the value, so keys stay out of files and chat:
   - `npx wrangler secret put RESEND_API_KEY`
   - `npx wrangler secret put STATE_SECRET` (use the same value as the Netlify site, so existing student tokens still work)
5. In `wrangler.jsonc`, set `COACH_EMAIL` and `FROM_EMAIL` to the real addresses.

## Deploy

`npx wrangler deploy`

Deploys are free, but batch changes anyway so each deploy is worth doing.

## Notes

- Saves on the Netlify site are stored in Netlify Blobs and will not carry over automatically. Students will start from a blank save on the new site unless the data is exported.
- Keep `gears-sim` separate from the live Due North site until the new deploy works.
