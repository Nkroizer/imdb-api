import DomParser from "dom-parser";
import { decode as entityDecoder } from "html-entities";
import apiRequestRawHtml from "./apiRequestRawHtml";

const MAX_SEASONS = 2;

export default async function seriesFetcher(id) {
  let allSeasons = [];
  let seasons = [];

  try {
    let parser = new DomParser();
    let rawHtml = await apiRequestRawHtml(
      `https://www.m.imdb.com/title/${id}/episodes/_ajax`
    );
    let dom = parser.parseFromString(rawHtml);

    let seasonOption = dom.getElementById("bySeason");
    let seasonOptions = seasonOption.getElementsByTagName("option");
    for (let i = 0; i < seasonOptions.length; i++) {
      try {
        const seasonId = seasonOptions[i].getAttribute("value");
        let season = {
          id: seasonId,
          api_path: `/title/${id}/season/${seasonId}`,
          isSelected: seasonOptions[i].getAttribute("selected") === "selected",
          name: "",
          episodes: [],
        };
        seasons.push(season);
      } catch (_) { }
    }

    allSeasons = [...seasons];
    seasons = seasons.reverse();
    seasons = seasons.slice(0, MAX_SEASONS);

    await Promise.all(
      seasons.map(async (season) => {
        try {
          let html = "";
          if (season.isSelected) {
            html = rawHtml;
          } else {
            html = await apiRequestRawHtml(
              `https://www.m.imdb.com/title/${id}/episodes/?season=${season.id}`
            );
          }

          let parsed = parseEpisodes(html);
          season.name = parsed.name;
          season.episodes = parsed.episodes;
        } catch (sfe) {
          season.error = sfe.toString();
        }
      })
    );

    seasons = seasons.filter((s) => s.episodes.length);
    seasons = seasons.map((s) => {
      delete s.isSelected;
      return s;
    });
  } catch (error) { }

  return {
    all_seasons: allSeasons.map((s) => ({
      id: s.id,
      name: `Season ${s.id}`,
      api_path: `/title/${id}/season/${s.id}`,
    })),
    seasons,
  };
}

export function parseEpisodes(raw) {
  let parser = new DomParser();
  let dom = parser.parseFromString(raw);

  // let name = dom.getElementById("episode_top").textContent.trim();
  // name = entityDecoder(name, { level: "html5" });

  let episodes = [];

  let episodeList = dom.getElementsByClassName("episode-item-wrapper")

  let index = 0

  for (let item of episodeList) {
    console.log("_________________________")
    let iit = item && item.innerText ? item.innerText.replace("TOP-RATED\n", "").replace(" ∙ ", "\n") : "";
    let iita = iit.split("\n")
    try {
      if (iita && iita.length > 0) {
        let title = null;
        try {
          title = iita[1]
        } catch (_) { }

        let publishedDate = null;
        try {
          publishedDate = iita[2]
        } catch (_) { }

        let plot = null;
        try {
          plot = iita[3]
        } catch (_) { }

        let star = 0;
        try {
          star = iita[4]
        } catch (_) { }

        let count = 0;
        try {
          count = iita[6] && iita[6].includes("(") ? trim(iita[6]).replace("(", "") : trim(iita[6]);
          count = iita[6] && iita[6].includes(")") ? trim(iita[6]).replace(")", "") : trim(iita[6]);
        } catch (_) { }

        index++

        episodes.push({
          idx: index + 1,
          title: title,
          plot: plot,
          publishedDate: publishedDate,
          rating: {
            count,
            star,
          },
        });
      }
    } catch (ss) {
      console.log(ss.message);
    }
  }

  return {
    name: "sparkels",
    episodes: episodes,
  };
}


