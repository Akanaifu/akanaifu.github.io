class StravaIntegration {
  constructor(accessToken, athleteId) {
    this.accessToken = accessToken;
    this.athleteId = athleteId;
    this.baseUrl = "https://www.strava.com/api/v3";
  }

  async getAthleteStats() {
    try {
      const response = await fetch(
        `${this.baseUrl}/athletes/${this.athleteId}/stats`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Erreur API Strava: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la récupération des stats Strava:", error);
      throw error;
    }
  }

  async getAthleteProfile() {
    try {
      const response = await fetch(`${this.baseUrl}/athlete`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur API Strava: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la récupération du profil Strava:", error);
      throw error;
    }
  }

  formatDistance(meters) {
    return (meters / 1000).toFixed(2);
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    return hours;
  }

  formatElevation(meters) {
    return Math.round(meters);
  }

  async getActivities(before = null, after = null, page = 1, perPage = 30) {
    try {
      let url = `${this.baseUrl}/athlete/activities?page=${page}&per_page=${perPage}`;

      // before et after doivent être des timestamps Unix (secondes depuis epoch)
      if (before) {
        url += `&before=${before}`;
      }
      if (after) {
        url += `&after=${after}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        let details = "";
        try {
          const payload = await response.json();
          details =
            payload?.message || payload?.error || JSON.stringify(payload);
        } catch {
          details = await response.text();
        }

        throw new Error(
          `Erreur API Strava: ${response.status}${details ? ` - ${details}` : ""}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la récupération des activités:", error);
      throw error;
    }
  }

  async getActivitiesByDateRange(startDate, endDate) {
    // Convertir les dates en timestamps Unix (secondes)
    const after = Math.floor(new Date(startDate).getTime() / 1000);
    const before = Math.floor(new Date(endDate).getTime() / 1000);

    return await this.getActivities(before, after);
  }

  async getAllActivitiesInRange(startDate, endDate) {
    const allActivities = [];
    let page = 1;
    const perPage = 200; // Maximum autorisé par Strava

    const after = Math.floor(new Date(startDate).getTime() / 1000);
    const before = Math.floor(new Date(endDate).getTime() / 1000);

    while (true) {
      const activities = await this.getActivities(before, after, page, perPage);

      if (activities.length === 0) {
        break;
      }

      allActivities.push(...activities);

      if (activities.length < perPage) {
        break;
      }

      page++;
    }

    return allActivities;
  }

  calculateStatsFromActivities(activities) {
    const stats = {
      count: activities.length,
      distance: 0,
      moving_time: 0,
      elapsed_time: 0,
      elevation_gain: 0,
      total_elevation_gain: 0,
    };

    activities.forEach((activity) => {
      if (activity.type === "Ride" || activity.type === "VirtualRide") {
        stats.distance += activity.distance || 0;
        stats.moving_time += activity.moving_time || 0;
        stats.elapsed_time += activity.elapsed_time || 0;
        stats.elevation_gain += activity.total_elevation_gain || 0;
        stats.total_elevation_gain += activity.total_elevation_gain || 0;
      }
    });

    return stats;
  }

  renderStats(stats, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const allTimeRide = stats.all_ride_totals;
    const ytdRide = stats.ytd_ride_totals;
    const recentRide = stats.recent_ride_totals;

    const html = `
      <div class="strava-stats">
        <h3>Statistiques Cyclisme</h3>
        
        <div class="stats-section">
          <h4>Total (Lifetime)</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Distance</span>
              <span class="stat-value">${this.formatDistance(allTimeRide.distance)} km</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Temps</span>
              <span class="stat-value">${this.formatTime(allTimeRide.moving_time)} h</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Dénivelé</span>
              <span class="stat-value">${this.formatElevation(allTimeRide.elevation_gain)} m</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Sorties</span>
              <span class="stat-value">${allTimeRide.count}</span>
            </div>
          </div>
        </div>

        <div class="stats-section">
          <h4>Cette année</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Distance</span>
              <span class="stat-value">${this.formatDistance(ytdRide.distance)} km</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Temps</span>
              <span class="stat-value">${this.formatTime(ytdRide.moving_time)} h</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Dénivelé</span>
              <span class="stat-value">${this.formatElevation(ytdRide.elevation_gain)} m</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Sorties</span>
              <span class="stat-value">${ytdRide.count}</span>
            </div>
          </div>
        </div>

        <div class="stats-section">
          <h4>28 derniers jours</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Distance</span>
              <span class="stat-value">${this.formatDistance(recentRide.distance)} km</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Temps</span>
              <span class="stat-value">${this.formatTime(recentRide.moving_time)} h</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Dénivelé</span>
              <span class="stat-value">${this.formatElevation(recentRide.elevation_gain)} m</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Sorties</span>
              <span class="stat-value">${recentRide.count}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  renderActivitiesList(activities, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = `
      <div class="activities-list">
        <h3>Activités (${activities.length})</h3>
        <div class="activities-grid">
          ${activities
            .map(
              (activity) => `
            <div class="activity-card">
              <div class="activity-header">
                <h4>${activity.name}</h4>
                <span class="activity-type">${activity.type}</span>
              </div>
              <div class="activity-stats">
                <div class="activity-stat">
                  <span class="stat-label">Distance</span>
                  <span class="stat-value">${this.formatDistance(activity.distance)} km</span>
                </div>
                <div class="activity-stat">
                  <span class="stat-label">Durée</span>
                  <span class="stat-value">${this.formatDuration(activity.moving_time)}</span>
                </div>
                <div class="activity-stat">
                  <span class="stat-label">Dénivelé</span>
                  <span class="stat-value">${this.formatElevation(
                    activity.total_elevation_gain,
                  )} m</span>
                </div>
              </div>
              <div class="activity-date">${new Date(
                activity.start_date,
              ).toLocaleDateString("fr-FR")}</div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }
}

// Export pour utilisation
window.StravaIntegration = StravaIntegration;
