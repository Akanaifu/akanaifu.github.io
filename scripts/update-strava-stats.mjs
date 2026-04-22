import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const outputFile = path.join(projectRoot, "DATA", "stravaStats.json");
const startDate = "2023-09-15";
const dryRun = process.argv.includes("--dry-run");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable manquante: ${name}`);
  }
  return value;
}

async function refreshAccessToken({ clientId, clientSecret, refreshToken }) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body,
  });

  const payload = await response.json();
  if (!response.ok) {
    const details =
      payload?.message || payload?.error || JSON.stringify(payload);
    throw new Error(`Refresh token refusé (${response.status}): ${details}`);
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    athleteId: payload?.athlete?.id,
  };
}

async function appendGithubOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath || !value) {
    return;
  }

  await fs.appendFile(outputPath, `${name}=${value}\n`, "utf8");
}

async function getActivities(
  accessToken,
  before,
  after,
  page = 1,
  perPage = 200,
) {
  const url = new URL("https://www.strava.com/api/v3/athlete/activities");
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("before", String(before));
  url.searchParams.set("after", String(after));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    const details =
      payload?.message || payload?.error || JSON.stringify(payload);
    throw new Error(
      `Récupération activités refusée (${response.status}): ${details}`,
    );
  }

  return payload;
}

async function getAllActivities(accessToken, startIso, endIso) {
  const allActivities = [];
  const perPage = 200;
  let page = 1;

  const after = Math.floor(new Date(startIso).getTime() / 1000);
  const before = Math.floor(new Date(endIso).getTime() / 1000);

  while (true) {
    const activities = await getActivities(
      accessToken,
      before,
      after,
      page,
      perPage,
    );

    if (!Array.isArray(activities) || activities.length === 0) {
      break;
    }

    allActivities.push(...activities);
    if (activities.length < perPage) {
      break;
    }

    page += 1;
  }

  return allActivities;
}

function computeRideStats(activities) {
  let movingTime = 0;
  let distance = 0;
  let rides = 0;

  for (const activity of activities) {
    if (activity.type === "Ride" || activity.type === "VirtualRide") {
      rides += 1;
      movingTime += Number(activity.moving_time || 0);
      distance += Number(activity.distance || 0);
    }
  }

  const hours = Math.round(movingTime / 3600);
  const distanceKm = Number((distance / 1000).toFixed(2));
  return { hours, distanceKm, activities: rides };
}

async function main() {
  const clientId = requireEnv("STRAVA_CLIENT_ID");
  const clientSecret = requireEnv("STRAVA_CLIENT_SECRET");
  const refreshToken = requireEnv("STRAVA_REFRESH_TOKEN");
  const athleteIdExpected = requireEnv("STRAVA_ATHLETE_ID");

  const today = new Date().toISOString().slice(0, 10);
  const tokenPayload = await refreshAccessToken({
    clientId,
    clientSecret,
    refreshToken,
  });

  const athleteIdActual = String(tokenPayload.athleteId || "");
  if (athleteIdActual && athleteIdActual !== String(athleteIdExpected)) {
    throw new Error(
      `Compte Strava inattendu: athlete.id=${athleteIdActual}, attendu=${athleteIdExpected}`,
    );
  }

  const accessToken = tokenPayload.accessToken;
  if (!accessToken) {
    throw new Error("Access token manquant dans la reponse Strava");
  }

  if (tokenPayload.refreshToken) {
    // Mask token in GitHub logs then expose it as workflow output for optional secret rotation.
    console.log(`::add-mask::${tokenPayload.refreshToken}`);
    await appendGithubOutput("next_refresh_token", tokenPayload.refreshToken);
  }

  const allActivities = await getAllActivities(accessToken, startDate, today);
  const stats = computeRideStats(allActivities);

  const output = {
    ...stats,
    startDate,
    endDate: today,
    updatedAt: new Date().toISOString(),
    source: "strava-actions",
  };

  if (dryRun) {
    console.log("[dry-run] Stats calculées:", output);
    return;
  }

  await fs.writeFile(
    outputFile,
    `${JSON.stringify(output, null, 2)}\n`,
    "utf8",
  );
  console.log(`Fichier mis à jour: ${outputFile}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
