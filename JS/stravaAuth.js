class StravaAuth {
  constructor(clientId, clientSecret, refreshToken) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getValidAccessToken() {
    // Si on a déjà un token valide, le retourner
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Sinon, obtenir un nouveau token
    return await this.refreshAccessToken();
  }

  async refreshAccessToken() {
    try {
      const body = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: "refresh_token",
      });

      const response = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body,
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
          `Erreur refresh token: ${response.status}${details ? ` - ${details}` : ""}`,
        );
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;

      console.log("✅ Nouveau token Strava obtenu");
      return this.accessToken;
    } catch (error) {
      console.error("❌ Erreur lors du refresh du token:", error);
      throw error;
    }
  }
}

window.StravaAuth = StravaAuth;
