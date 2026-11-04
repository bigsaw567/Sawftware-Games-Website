"""Verify the exact runtime tags against registry manifests; no Docker required."""
import json
import urllib.request
from pathlib import Path

ACCEPT = ", ".join([
    "application/vnd.oci.image.index.v1+json",
    "application/vnd.docker.distribution.manifest.list.v2+json",
    "application/vnd.oci.image.manifest.v1+json",
    "application/vnd.docker.distribution.manifest.v2+json",
])


def get(url, token=None):
    headers = {"Accept": ACCEPT}
    if token:
        headers["Authorization"] = "Bearer " + token
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60) as response:
        return json.load(response), response.headers.get("Docker-Content-Digest")


def verify(registry, repository, tag):
    token = None
    if registry == "registry-1.docker.io":
        auth, _ = get("https://auth.docker.io/token?service=registry.docker.io&scope=repository:" + repository + ":pull")
        token = auth["token"]
    base = f"https://{registry}/v2/{repository}"
    manifest, digest = get(f"{base}/manifests/{tag}", token)
    platform = None
    if "manifests" in manifest:
        candidates = [m for m in manifest["manifests"]
                      if m.get("platform", {}).get("os") == "linux"
                      and m.get("platform", {}).get("architecture") == "arm"
                      and m.get("platform", {}).get("variant") == "v7"]
        if not candidates:
            raise RuntimeError(f"{repository}:{tag} has no linux/arm/v7 manifest")
        selected = candidates[0]
        platform = selected["platform"]
        manifest, _ = get(f"{base}/manifests/{selected['digest']}", token)
    config, _ = get(f"{base}/blobs/{manifest['config']['digest']}", token)
    if config.get("os") != "linux" or config.get("architecture") != "arm":
        raise RuntimeError(f"Unexpected image configuration for {repository}:{tag}")
    # Microsoft's architecture-specific tag may be a single manifest without variant metadata.
    if platform is None and config.get("variant") != "v7" and not tag.endswith("arm32v7"):
        raise RuntimeError(f"ARMv7 variant not established for {repository}:{tag}")
    image = f"{registry}/{repository}:{tag}"
    print(f"PASS {image}: linux/arm/v7")
    return {"image": image, "platform": "linux/arm/v7", "digest": digest,
            "configArchitecture": config["architecture"], "configOs": config["os"]}


images = [verify("mcr.microsoft.com", "dotnet/aspnet", "8.0-bookworm-slim-arm32v7"),
          verify("registry-1.docker.io", "library/caddy", "2.11.7-alpine"),
          verify("registry-1.docker.io", "library/postgres", "17.11-bookworm")]
Path(__file__).with_name("runtime-images.json").write_text(json.dumps(images, indent=2) + "\n", encoding="utf-8")
builders = [verify("mcr.microsoft.com", "dotnet/sdk", "8.0-bookworm-slim-arm32v7"),
            verify("registry-1.docker.io", "library/node", "22-bookworm-slim")]
Path(__file__).with_name("build-images.json").write_text(json.dumps(builders, indent=2) + "\n", encoding="utf-8")
