(function registerStravaStats(global) {
  async function fetchPortfolioStats(file) {
    try {
      const res = await fetch(file);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  function applyVeloHours(data, stats) {
    if (!stats || typeof stats.hours !== "number") {
      return;
    }

    const veloEntry = data.find((item) => {
      const name = String(item.nom || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return name === "velo";
    });

    if (veloEntry) {
      veloEntry.heures_prestees = `~${Math.round(stats.hours)}h`;
    }
  }

  global.StravaStats = {
    fetchPortfolioStats,
    applyVeloHours,
  };
})(window);