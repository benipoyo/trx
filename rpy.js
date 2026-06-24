function toDetails(str) {
  const s = $("<div>").text(str).html();
  if (new Blob([s]).size <= 32 && !/\n/.test(s)) return s;
  return $("<details>").html(s.replace(/\r?\n/g, "<br>")).prop("outerHTML");
}

async function getRpyHeader(file) {
  const rpy = new Uint8Array(await file.arrayBuffer());
  const stages = $(`
    <details>
      <table class="tablesorter-blue stages">
        <thead>
        </thead>
        <tbody>
        </tbody>
      </table>
    </details>
  `);
  switch (new TextDecoder().decode(rpy.slice(0, 4))) {
    case "T6RP": {
      stages.find("thead").html(`
        <tr>
          <th></th>
          <th>Score</th>
          <th>Power</th>
          <th>P</th>
          <th>B</th>
        </tr>
      `);
      const dat = th6(rpy);
      const type = ["ReimuA", "ReimuB", "MarisaA", "MarisaB"][dat.type];
      const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra"][dat.difficulty];
      for (const i in dat.stages) {
        const j = +i + 1;
        stages.find("tbody").append(`
          <tr>
            <td>${j < 7 ? j : "Ex"}</td>
            <td>${dat.stages[j - 1].score}</td>
            <td>${j in dat.stages ? dat.stages[j].power : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].player : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].bomb : ""}</td>
          </tr>
        `);
      }
      const u = userData(rpy);
      return {
        game: "th6",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears: "-",
        thprac: u.thprac,
        note: "",
      };
    }
    case "T7RP": {
      stages.find("thead").html(`
        <tr>
          <th></th>
          <th>Score</th>
          <th>Ch+</th>
          <th>ChPIV</th>
          <th>ChMax</th>
          <th>Graze</th>
          <th>Point</th>
          <th>Power</th>
          <th>P</th>
          <th>B</th>
          <th>Spell</th>
        </tr>
      `);
      const dat = th7(rpy);
      const type = ["ReimuA", "ReimuB", "MarisaA", "MarisaB", "SakuyaA", "SakuyaB"][dat.type];
      const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra", "Phantasm"][dat.difficulty];
      for (const i in dat.stages) {
        const j = +i + 1;
        stages.find("tbody").append(`
          <tr>
            <td>${j < 7 ? j : "Ex"}</td>
            <td>${dat.stages[j - 1].score * 10}</td>
            <td>${j in dat.stages ? dat.stages[j].cherryPlus : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].cherryPiv : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].cherryMax : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].graze : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].point : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].power : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].player : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].bomb : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].spell : ""}</td>
          </tr>
        `);
      }
      const u = userData(rpy);
      return {
        game: "th7",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears: "-",
        thprac: u.thprac,
        note: "",
      };
    }
    case "T8RP": {
      stages.find("thead").html(`
        <tr>
          <th></th>
          <th>Score</th>
          <th>PIV</th>
          <th>Graze</th>
          <th>Point</th>
          <th>Power</th>
          <th>P</th>
          <th>B</th>
        </tr>
      `);
      const dat = th8(rpy);
      const type = ["RY", "MA", "SR", "YY", "Reimu", "Yukari", "Marisa", "Alice", "Sakuya", "Remilia", "Youmu", "Yuyuko"][dat.type];
      const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra"][dat.difficulty];
      const next = [];
      let p = -1;
      for (const i in dat.stages) {
        if (p >= 0) next[p] = i;
        p = i;
      }
      for (const i in dat.stages) {
        const st = ["1", "2", "3", "4A", "4B", "5", "6A", "6B", "Ex"][i];
        stages.find("tbody").append(`
          <tr>
            <td>${st}</td>
            <td>${dat.stages[i].score * 10}</td>
            <td>${i in next ? dat.stages[next[i]].piv : ""}</td>
            <td>${i in next ? dat.stages[next[i]].graze : ""}</td>
            <td>${i in next ? dat.stages[next[i]].point : ""}</td>
            <td>${i in next ? dat.stages[next[i]].power : ""}</td>
            <td>${i in next ? dat.stages[next[i]].player : ""}</td>
            <td>${i in next ? dat.stages[next[i]].bomb : ""}</td>
          </tr>
        `);
      }
      const u = userData(rpy);
      const spell = dat.spellNo < 0 ? "" : "No." + (dat.spellNo + 1);
      return {
        game: "th8",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: u.year + "-" + dat.date + " " + u.time,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears: u.clear,
        thprac: u.thprac,
        note: toDetails(spell + (spell.length && u.note.length ? "\r\n" : "") + u.note),
      };
    }
    case "T9RP": {
      stages.find("thead").html(`
        <tr>
          <th></th>
          <th>Score</th>
          <th>P</th>
          <th>P2Shot</th>
          <th>P2Score</th>
        </tr>
      `);
      const dat = th9(rpy);
      const chara = ["Reimu", "Marisa", "Sakuya", "Youmu", "Reisen", "Cirno", "Lyrica", "Mystia", "Tewi", "Yuuka", "Aya", "Medicine", "Komachi", "Eiki", "Merlin", "Lunasa"];
      const type = chara[dat.type] + (dat.cpu ? "(CPU)" : "");
      const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra"][dat.difficulty];
      for (const i in dat.stages) {
        const j = +i + 1;
        stages.find("tbody").append(`
          <tr>
            <td>${j < 10 ? j : "VS"}</td>
            <td>${j < 10 ? j in dat.stages ? dat.stages[j][0].score * 10 : "" : dat.stages[i][0].score * 10}</td>
            <td>${j in dat.stages ? dat.stages[j][0].player : ""}</td>
            <td>${chara[dat.stages[i][1].type] + (dat.stages[i][1].cpu ? "(CPU)" : "")}</td>
            <td>${j < 10 ? j in dat.stages ? dat.stages[j][1].score * 10 : "" : dat.stages[i][1].score * 10}</td>
          </tr>
        `);
      }
      const u = userData(rpy);
      return {
        game: "th9",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: "",
        date: dat.date,
        stages: stages.prop("outerHTML").replace(/\s+/g, " "),
        clears: "-",
        thprac: u.thprac,
        note: toDetails(u.note),
      };
    }
    case "t10r": {
      stages.find("thead").html(`
        <tr>
          <th></th>
          <th>Score</th>
          <th>PIV</th>
          <th>Power</th>
          <th>P</th>
        </tr>
      `);
      const dat = th10(rpy);
      const type = ["ReimuA", "ReimuB", "ReimuC", "MarisaA", "MarisaB", "MarisaC"][dat.type];
      const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra"][dat.difficulty];
      for (const i in dat.stages) {
        const j = +i + 1;
        stages.find("tbody").append(`
          <tr>
            <td>${j < 7 ? j : "Ex"}</td>
            <td>${j in dat.stages ? dat.stages[j].score * 10 : dat.score * 10}</td>
            <td>${j in dat.stages ? dat.stages[j].piv * 10 : ""}</td>
            <td>${j in dat.stages ? (dat.stages[j].power / 20).toFixed(2) : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].player : ""}</td>
          </tr>
        `);
      }
      let clears = "-";
      if (dat.clears >= 1 && dat.clears <= 6) clears = "(" + dat.clears + ")";
      if (dat.clears == 7) clears = "(Ex)";
      if (dat.clears > 7) clears = "(C)";
      const u = userData(rpy);
      return {
        game: "th10",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears,
        thprac: u.thprac,
        note: toDetails(u.note),
      };
    }
    case "t11r": {
      stages.find("thead").html(`
        <tr>
          <th></th>
          <th>Score</th>
          <th>PIV</th>
          <th>Graze</th>
          <th>Power</th>
          <th>P</th>
        </tr>
      `);
      const dat = th11(rpy);
      const type = ["ReimuA", "ReimuB", "ReimuC", "MarisaA", "MarisaB", "MarisaC"][dat.type];
      const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra"][dat.difficulty];
      for (const i in dat.stages) {
        const j = +i + 1;
        stages.find("tbody").append(`
          <tr>
            <td>${j < 7 ? j : "Ex"}</td>
            <td>${j in dat.stages ? dat.stages[j].score * 10 : dat.score * 10}</td>
            <td>${j in dat.stages ? dat.stages[j].piv : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].graze : ""}</td>
            <td>${j in dat.stages ? (dat.stages[j].power / 20).toFixed(2) : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].player + "+" + dat.stages[j].piece + "/5" : ""}</td>
          </tr>
        `);
      }
      let clears = "-";
      if (dat.clears >= 1 && dat.clears <= 6) clears = "(" + dat.clears + ")";
      if (dat.clears == 7) clears = "(Ex)";
      if (dat.clears > 7) clears = "(C)";
      const u = userData(rpy);
      return {
        game: "th11",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears,
        thprac: u.thprac,
        note: toDetails(u.note),
      };
    }
    case "t12r": {
      stages.find("thead").html(`
        <tr>
          <th></th>
          <th>Score</th>
          <th>PIV</th>
          <th>Graze</th>
          <th>Power</th>
          <th>P</th>
          <th>B</th>
        </tr>
      `);
      const dat = th12(rpy);
      const type = ["ReimuA", "ReimuB", "MarisaA", "MarisaB", "SanaeA", "SanaeB"][dat.type];
      const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra"][dat.difficulty];
      for (const i in dat.stages) {
        const j = +i + 1;
        stages.find("tbody").append(`
          <tr>
            <td>${j < 7 ? j : "Ex"}</td>
            <td>${j in dat.stages ? dat.stages[j].score * 10 : dat.score * 10}</td>
            <td>${j in dat.stages ? dat.stages[j].piv * 10 : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].graze : ""}</td>
            <td>${j in dat.stages ? (dat.stages[j].power / 100).toFixed(2) : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].player + "+" + dat.stages[j].piece + "/4" : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].bomb + "+" + dat.stages[j].biece + "/3" : ""}</td>
          </tr>
        `);
      }
      let clears = "-";
      if (dat.clears >= 1 && dat.clears <= 6) clears = "(" + dat.clears + ")";
      if (dat.clears == 7) clears = "(Ex)";
      if (dat.clears > 7) clears = "(C)";
      const u = userData(rpy);
      return {
        game: "th12",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears,
        thprac: u.thprac,
        note: toDetails(u.note),
      };
    }
    case "128r": {
      stages.find("thead").html(`
        <tr>
          <th></th>
          <th>Score</th>
          <th>Motivation</th>
          <th>PF</th>
          <th>Area</th>
        </tr>
      `);
      const dat = th128(rpy);
      const type = ["A-1", "A-2", "B-1", "B-2", "C-1", "C-2", "Extra"][dat.type];
      const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra"][dat.difficulty];
      const next = [];
      let p = -1;
      for (const i in dat.stages) {
        if (p >= 0) next[p] = i;
        p = i;
      }
      for (const i in dat.stages) {
        const st = ["A1-1", "A1-2", "A1-3", "A2-2", "A2-3", "B1-1", "B1-2", "B1-3", "B2-2", "B2-3", "C1-1", "C1-2", "C1-3", "C2-2", "C2-3", "Ex"][i];
        stages.find("tbody").append(`
          <tr>
            <td>${st}</td>
            <td>${i in next ? dat.stages[next[i]].score * 10 : dat.score * 10}</td>
            <td>${i in next ? dat.stages[next[i]].motivation : ""}</td>
            <td>${i in next ? dat.stages[next[i]].pf : ""}</td>
            <td>${i in next ? dat.stages[next[i]].area : ""}</td>
          </tr>
        `);
      }
      let clears = "-";
      if (dat.clears >= 1 && dat.clears <= 15) clears = "(" + st[dat.clears - 1].slice(3) + ")";
      if (dat.clears == 16) clears = "(Ex)";
      if (dat.clears > 16) clears = "(C)";
      const u = userData(rpy);
      return {
        game: "th128",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears,
        thprac: u.thprac,
        note: toDetails(u.note),
      };
    }
    case "t13r": {
      const u = userData(rpy);
      if (u.game === "th13") {
        stages.find("thead").html(`
          <tr>
            <th></th>
            <th>Score</th>
            <th>PIV</th>
            <th>Graze</th>
            <th>Power</th>
            <th>P</th>
            <th>B</th>
            <th>Trance</th>
          </tr>
        `);
        const dat = th13(rpy);
        const type = ["Reimu", "Marisa", "Sanae", "Youmu"][dat.type];
        const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra", "Overdrive"][dat.difficulty];
        const ext = [8, 10, 12, 15, 18, 20, 25];
        for (const i in dat.stages) {
          const j = +i + 1;
          stages.find("tbody").append(`
            <tr>
              <td>${j < 7 ? j : "Ex"}</td>
              <td>${j in dat.stages ? dat.stages[j].score * 10 : dat.score * 10}</td>
              <td>${j in dat.stages ? dat.stages[j].piv * 10 : ""}</td>
              <td>${j in dat.stages ? dat.stages[j].graze : ""}</td>
              <td>${j in dat.stages ? (dat.stages[j].power / 100).toFixed(2) : ""}</td>
              <td>${j in dat.stages ? dat.stages[j].player + "+" + dat.stages[j].piece + "/" + ext[Math.max(0, Math.min(6, dat.stages[j].extend))] : ""}</td>
              <td>${j in dat.stages ? dat.stages[j].bomb + "+" + dat.stages[j].biece + "/8" : ""}</td>
              <td>${j in dat.stages ? Math.floor(dat.stages[j].trance / 200) + "+" + dat.stages[j].trance % 200 + "/200" : ""}</td>
            </tr>
          `);
        }
        let clears = "-";
        if (dat.clears >= 1 && dat.clears <= 6) clears = "(" + dat.clears + ")";
        if (dat.clears == 7) clears = "(Ex)";
        if (dat.clears > 7) clears = "(C)";
        const spell = dat.spellNo < 0 ? "" : "No." + (dat.spellNo + 1);
        return {
          game: "th13",
          name: $("<div>").text(dat.name).html(),
          difficulty,
          type,
          score: dat.score * 10,
          date: dat.date,
          stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
          clears,
          thprac: u.thprac,
          note: toDetails(spell + (spell.length && u.note.length ? "\r\n" : "") + u.note),
        };
      }
      else if (u.game === "th14") {
        stages.find("thead").html(`
          <tr>
            <th></th>
            <th>Score</th>
            <th>PIV</th>
            <th>Graze</th>
            <th>Power</th>
            <th>P</th>
            <th>B</th>
          </tr>
        `);
        const dat = th14(rpy);
        const type = ["ReimuA", "ReimuB", "MarisaA", "MarisaB", "SakuyaA", "SakuyaB"][dat.type];
        const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra"][dat.difficulty];
        for (const i in dat.stages) {
          const j = +i + 1;
          stages.find("tbody").append(`
            <tr>
              <td>${j < 7 ? j : "Ex"}</td>
              <td>${j in dat.stages ? dat.stages[j].score * 10 : dat.score * 10}</td>
              <td>${j in dat.stages ? dat.stages[j].piv * 10 : ""}</td>
              <td>${j in dat.stages ? dat.stages[j].graze : ""}</td>
              <td>${j in dat.stages ? (dat.stages[j].power / 100).toFixed(2) : ""}</td>
              <td>${j in dat.stages ? dat.stages[j].player + "+" + dat.stages[j].piece + "/3" : ""}</td>
              <td>${j in dat.stages ? dat.stages[j].bomb + "+" + dat.stages[j].biece + "/8" : ""}</td>
            </tr>
          `);
        }
        let clears = "-";
        if (dat.clears >= 1 && dat.clears <= 6) clears = "(" + dat.clears + ")";
        if (dat.clears == 7) clears = "(Ex)";
        if (dat.clears > 7) clears = "(C)";
        const spell = dat.spellNo < 0 ? "" : "No." + (dat.spellNo + 1);
        return {
          game: "th14",
          name: $("<div>").text(dat.name).html(),
          difficulty,
          type,
          score: dat.score * 10,
          date: dat.date,
          stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
          clears,
          thprac: u.thprac,
          note: toDetails(spell + (spell.length && u.note.length ? "\r\n" : "") + u.note),
        };
      }
      else {
        return {};
      }
    }
    case "t15r": {
      stages.find("thead").html(`
        <tr>
          <th></th>
          <th>Score</th>
          <th>PIV</th>
          <th>Graze</th>
          <th>Power</th>
          <th>P</th>
          <th>B</th>
        </tr>
      `);
      const dat = th15(rpy);
      const type = ["Reimu", "Marisa", "Sanae", "Reisen"][dat.type];
      const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra"][dat.difficulty];
      for (const i in dat.stages) {
        const j = +i + 1;
        stages.find("tbody").append(`
          <tr>
            <td>${j < 7 ? j : "Ex"}</td>
            <td>${j in dat.stages ? dat.stages[j].score * 10 : dat.score * 10}</td>
            <td>${j in dat.stages ? dat.stages[j].piv * 10 : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].graze : ""}</td>
            <td>${j in dat.stages ? (dat.stages[j].power / 100).toFixed(2) : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].player + "+" + dat.stages[j].piece + "/3" : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].bomb + "+" + dat.stages[j].biece + "/5" : ""}</td>
          </tr>
        `);
      }
      let clears = "-";
      if (dat.clears >= 1 && dat.clears <= 6) clears = "(" + dat.clears + ")";
      if (dat.clears == 7) clears = "(Ex)";
      if (dat.clears > 7) clears = "(C)";
      const spell = dat.spellNo < 0 ? "" : "No." + (dat.spellNo + 1);
      const u = userData(rpy);
      return {
        game: "th15",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears,
        thprac: u.thprac,
        note: toDetails(spell + (spell.length && u.note.length ? "\r\n" : "") + u.note),
      };
    }
    case "t16r": {
      stages.find("thead").html(`
        <tr>
          <th></th>
          <th>Score</th>
          <th>PIV</th>
          <th>Graze</th>
          <th>Power</th>
          <th>P</th>
          <th>B</th>
          <th>Season</th>
        </tr>
      `);
      const dat = th16(rpy);
      const type = ["Reimu", "Cirno", "Aya", "Marisa"][dat.type] + ["Spr", "Sum", "Aut", "Win", ""][dat.season];
      const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra"][dat.difficulty];
      const season_powers = [100, 130, 160, 200, 250, 300];
      for (const i in dat.stages) {
        const j = +i + 1;
        let season = "6";
        if (j in dat.stages) {
          let m = 0;
          let n = dat.stages[j].season;
          for (let d of season_powers) {
            if (n < d) {
              season = m + "+" + n + "/" + d;
              break;
            }
            m++;
            n -= d;
          }
        }
        stages.find("tbody").append(`
          <tr>
            <td>${j < 7 ? j : "Ex"}</td>
            <td>${j in dat.stages ? dat.stages[j].score * 10 : dat.score * 10}</td>
            <td>${j in dat.stages ? dat.stages[j].piv * 10 : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].graze : ""}</td>
            <td>${j in dat.stages ? (dat.stages[j].power / 100).toFixed(2) : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].player : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].bomb + "+" + dat.stages[j].biece + "/5" : ""}</td>
            <td>${j in dat.stages ? season : ""}</td>
          </tr>
        `);
      }
      let clears = "-";
      if (dat.clears >= 1 && dat.clears <= 6) clears = "(" + dat.clears + ")";
      if (dat.clears == 7) clears = "(Ex)";
      if (dat.clears > 7) clears = "(C)";
      const spell = dat.spellNo < 0 ? "" : "No." + (dat.spellNo + 1);
      const u = userData(rpy);
      return {
        game: "th16",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears,
        thprac: u.thprac,
        note: toDetails(spell + (spell.length && u.note.length ? "\r\n" : "") + u.note),
      };
    }
    default:
      return {};
  }
}

$(function () {
  let lastChecked = -1;
  let rpyCnt = 0;

  function updateHeaderCheck() {
    let cnt = 0;
    let cntSel = 0;
    const cntAll = $(".check").length;
    $(".check").each(function () {
      if ($(this).is(":hidden")) return true;
      if ($(this).is(":checked")) cntSel++;
      cnt++;
    });
    if (cntSel === 0) {
      $("#checkAll").prop("checked", false);
      $("#checkAll").prop("indeterminate", false);
    }
    else if (cntSel === cnt) {
      $("#checkAll").prop("checked", true);
      $("#checkAll").prop("indeterminate", false);
    }
    else {
      $("#checkAll").prop("checked", false);
      $("#checkAll").prop("indeterminate", true);
    }
    $("#count").text(`${cnt}/${cntAll} items`);
    $("#import").prop("disabled", cntAll);
  }

  $("#table").bind("tablesorter-initialized", function () {
    updateHeaderCheck();
  });

  $("#table").tablesorter({
    // sortReset:true,
    theme: 'blue',
    widgets: ["zebra", "filter"],
    headers: {
      0: { sorter: false },
      6: { sorter: "digit" },
      7: { sorter: "shortDate" },
      8: { sorter: "shortDate" },
      9: { sorter: false },
    },
    widgetOptions: {
      filter_functions: {
        0: {
          "☑": function (e, n, f, i, $r, c, data) { return $r.find(".check").prop("checked") },
          "☐": function (e, n, f, i, $r, c, data) { return !$r.find(".check").prop("checked") },
        },
        1: true,
        4: true,
        5: true,
        10: true,
        11: true,
      },
      filter_searchDelay: 0,
    },
  });

  async function addRow(file, index) {
    // const size = file.size;
    const fDate = formatTime(new Date(file[0].lastModified));
    const dat = await getRpyHeader(file[0]);
    if (file.length === 3 && (dat.game === "th6" || dat.game === "th7")) {
      const txt = new Uint8Array(await file[2].arrayBuffer());
      let note;
      if (txt[0] === 0xef && txt[1] === 0xbb && txt[2] === 0xbf) note = new TextDecoder("utf-8", { ignoreBOM: true }).decode(txt);
      else note = new TextDecoder("shift-jis").decode(txt);
      dat.note = toDetails(note);
    }
    const row = $(`
      <tr id="row${index}" class="rpyRow">
        <td>
          <label class="checkLabel">
            <input type="checkbox" class="check" />
          </label>
        </td>
        <td>${dat.game}</td>
        <td>${$("<div>").text(file[1]).html()}</td>
        <td>${dat.name}</td>
        <td>${dat.difficulty}</td>
        <td>${dat.type}</td>
        <td style="text-align: right;">${dat.score}</td>
        <td>${dat.date}</td>
        <td>${fDate}</td>
        <td>${dat.stages}</td>
        <td>${dat.clears}</td>
        <td>${dat.thprac ? "Yes" : "No"}</td>
        <td>${dat.note}</td>
      </tr>
    `);
    row.find(".check").on("click", function (e) {
      const now = parseInt($(this).closest("tr").attr("id").match(/\d*$/), 10);
      if (!e.shiftKey || lastChecked < 0 || lastChecked === now || $("#row" + lastChecked).length === 0) {
        lastChecked = now;
        updateHeaderCheck();
        return;
      }
      const checked = $(this).prop("checked");
      let cnt = 0;
      $(".check").each(function () {
        const v = parseInt($(this).closest("tr").attr("id").match(/\d*$/), 10);
        if (v === lastChecked || v === now) cnt++;
        if (cnt === 0) return true;
        if ($(this).is(":visible")) $(this).prop("checked", checked);
        if (cnt > 1) return false;
      });
      updateHeaderCheck();
    });
    $("#rpyInfo").append(row);
  }

  async function inputFiles(files) {
    const len = files.length;
    for (let i = 0; i < len; i++) {
      $("#count").text(`${i + 1}/${len}`);
      await addRow(files[i], rpyCnt + i);
    }
    rpyCnt += len;
    $("#count").empty();
    updateHeaderCheck();
    $("#table").trigger("update");
  }

  $("#export").on("click", function () {
    const dat = $("<div>");
    $("<div>", { id: "cnt" }).text(rpyCnt).appendTo(dat);
    $("#table").clone(false).appendTo(dat);
    const xml = new XMLSerializer().serializeToString(new DOMParser().parseFromString(dat.prop("outerHTML"), "text/html"));
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    $("<a>", { href: url, download: "replays.xml" })[0].click();
    URL.revokeObjectURL(url);
  });

  $("#import").on("change", function (e) {
    e.target.files[0].text().then((r) => {
      $("#rpyInfo").append($(r).find("#rpyInfo").html());
      lastChecked = -1;
      rpyCnt = +$(r).find("#cnt").text();
      updateHeaderCheck();
      $("#table").trigger("update");
    });
  });

  $("#inputFile").on("change", function (e) {
    const files = Array.from(e.target.files).filter((f) => /\.rpy$/.test(f.name)).map((f) => [f, f.name]);
    inputFiles(files);
  });

  $("#inputDir").on("change", function (e) {
    const files = Array.from(e.target.files).filter((f) => /\.rpy$|\.txt$/.test(f.webkitRelativePath)).map((f) => [f, f.webkitRelativePath]);
    const id = [...Array(files.length)].map((_, i) => i);
    id.sort((i, j) => {
      const fi = files[i][1];
      const fj = files[j][1];
      const fi0 = fi.replace(/\....$/, "");
      const fj0 = fj.replace(/\....$/, "");
      if (fi0 < fj0) return -1;
      if (fi0 > fj0) return 1;
      return fi < fj ? -1 : fi > fj ? 1 : 0;
    });
    for (let i = 1; i < id.length; i++) {
      if (files[id[i - 1]][1].replace(/\....$/, "") === files[id[i]][1].replace(/\....$/, "")) {
        files[id[i - 1]].push(files[id[i]][0]);
      }
    }
    inputFiles(files.filter((f) => /\.rpy$/.test(f[1])));
  });

  $("#removeSelected").on("click", function () {
    const cRows = $(".check:checked").closest("tr");
    const cnt = cRows.length;
    if (cnt === 0) return;
    const ok = confirm(`Remove ${cnt} selected items`);
    if (!ok) return;
    cRows.remove();
    updateHeaderCheck();
    $("#table").trigger("update");
  });

  $("#removeUnselected").on("click", function () {
    const cRows = $(".check:not(:checked)").closest("tr");
    const cnt = cRows.length;
    if (cnt === 0) return;
    const ok = confirm(`Remove ${cnt} unselected items`);
    if (!ok) return;
    cRows.remove();
    updateHeaderCheck();
    $("#table").trigger("update");
  });

  $("#removeHidden").on("click", function () {
    const hRows = $(".rpyRow:hidden");
    const cnt = hRows.length;
    if (cnt === 0) return;
    const ok = confirm(`Remove ${cnt} hidden items`);
    if (!ok) return;
    hRows.remove();
    updateHeaderCheck();
    $("#table").trigger("update");
  });

  $("#checkAll").on("change", function () {
    const checked = $(this).prop("checked");
    $(".check").each(function () {
      if ($(this).is(":hidden")) return true;
      $(this).prop("checked", checked);
    });
    updateHeaderCheck();
  });

  $("#table").bind("filterEnd", function () {
    updateHeaderCheck();
  });
});
