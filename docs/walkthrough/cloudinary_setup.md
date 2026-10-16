# Cloudinary and Protected Media

The backend selects its media storage from environment configuration. In production, persistent uploads require the Cloudinary settings shown in `backend/.env.example`; without a configured production storage provider, do not assume local container files are durable.

## Configure credentials safely

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in an ignored local environment file or an approved deployment secret store. Do not commit credentials. Never place the API secret in web build variables, Flutter defines, or a public issue.

## Distinguish public content from protected evidence

The custom `ResidentAwareCloudinaryStorage` uses authenticated assets for the private directories `resident_ids/`, `resident_billings/`, and `payment_proofs/`. These files are retrieved through backend views that apply authentication, ownership/tenant permissions, and private response headers. Local/test media serving blocks direct access to sensitive media paths.

Do not call `.url()` for a protected asset, construct a Cloudinary delivery URL, or expose storage names in client responses. Store and return evidence only through the authenticated media endpoint for that feature.

Issue-report images use a different path and policy from identity or payment evidence. Check the current model, serializer, storage configuration, and permissions before deciding whether an incident image can be rendered or shared. Never infer privacy from the fact that a file is hosted on Cloudinary.

## Safe local validation

Use mocked storage in unit tests. For an authorized integration check, use a non-production Cloudinary environment and synthetic images, then verify both permitted and denied media requests. Do not upload real resident identity, utility-bill, payment, or incident records to a developer account.
