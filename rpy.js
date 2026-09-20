async function getRpyInfo(file, path) {
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
  let head = new TextDecoder().decode(rpy.slice(0, 4));
  const user = userData(rpy);
  // zun fckery
  if (head === "t13r" && (user.game === "th14" || (user.game !== "th13" && /(?:^|\/)th14_[^/]*$/.test(path)))) {
    head = "t14r";
  }
  if (head === "T6RP" && rpy[4] >= 0xf) {
    head = "T6RPnc";
  }
  switch (head) {
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
      const dat = rpy[4] < 3 ? th6(rpy) : th6c(rpy);
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
      return {
        game: rpy[4] < 3 ? "th6" : "th6c",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears: "-",
        thprac: user.thprac,
      };
    }
    case "T6RPnc": {
      const dat = th6nc(rpy);
      stages.find("thead").html(dat.mode ? `
        <tr>
          <th></th>
          <th>Score</th>
          <th>Power</th>
          <th>M</th>
        </tr>
      `: `
        <tr>
          <th></th>
          <th>Score</th>
          <th>Power</th>
          <th>P</th>
          <th>B</th>
        </tr>
      `);
      const type = ["ReimuA", "ReimuB", "MarisaA", "MarisaB"][dat.type];
      const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra", "Spell"][dat.spell ? 5 : dat.difficulty] + (dat.mode && !dat.spell ? "Ch" : "");
      for (const i in dat.stages) {
        const j = +i + 1;
        stages.find("tbody").append(dat.mode ? `
          <tr>
            <td>${j < 7 ? j : "Ex"}</td>
            <td>${dat.stages[j - 1].score}</td>
            <td>${j in dat.stages ? dat.stages[j].power : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].miss : ""}</td>
          </tr>
        `: `
          <tr>
            <td>${j < 7 ? j : "Ex"}</td>
            <td>${dat.stages[j - 1].score}</td>
            <td>${j in dat.stages ? dat.stages[j].power : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].player : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].bomb : ""}</td>
          </tr>
        `);
      }
      const spell = dat.spell === 0 ? "" : "No." + (dat.difficulty + 1);
      return {
        game: "th6nc",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score,
        date: dat.date,
        stages: dat.difficulty != 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears: "-",
        spell,
        thprac: user.thprac,
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
      return {
        game: "th7",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears: "-",
        thprac: user.thprac,
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
      const spell = dat.spellNo < 0 ? "" : "No." + (dat.spellNo + 1);
      return {
        game: "th8",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: user.year + "-" + dat.date + " " + user.time,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears: user.clear,
        thprac: user.thprac,
        spell,
        note: user.note,
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
      const type = chara[dat.type] + (dat.cpu ? "CPU" : "");
      const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra"][dat.difficulty];
      for (const i in dat.stages) {
        const j = +i + 1;
        stages.find("tbody").append(`
          <tr>
            <td>${j < 10 ? j : "VS"}</td>
            <td>${j < 10 ? j in dat.stages ? dat.stages[j][0].score * 10 : "" : dat.stages[i][0].score * 10}</td>
            <td>${j in dat.stages ? dat.stages[j][0].player : ""}</td>
            <td>${chara[dat.stages[i][1].type] + (dat.stages[i][1].cpu ? "CPU" : "")}</td>
            <td>${j < 10 ? j in dat.stages ? dat.stages[j][1].score * 10 : "" : dat.stages[i][1].score * 10}</td>
          </tr>
        `);
      }
      return {
        game: "th9",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: "",
        date: dat.date,
        stages: stages.prop("outerHTML").replace(/\s+/g, " "),
        clears: "-",
        thprac: user.thprac,
        note: user.note,
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
      const type = ["Reimu", "Marisa"][dat.type] + ["A", "B", "C"][dat.sub];
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
      return {
        game: "th10",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears,
        thprac: user.thprac,
        note: user.note,
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
      const type = ["Reimu", "Marisa"][dat.type] + ["A", "B", "C"][dat.sub];
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
      return {
        game: "th11",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears,
        thprac: user.thprac,
        note: user.note,
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
      const type = ["Reimu", "Marisa", "Sanae"][dat.type] + ["A", "B"][dat.sub];
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
      return {
        game: "th12",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears,
        thprac: user.thprac,
        note: user.note,
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
      return {
        game: "th128",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears,
        thprac: user.thprac,
        note: user.note,
      };
    }
    case "t13r": {
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
        thprac: user.thprac,
        spell,
        note: user.note,
      };
    }
    case "t14r": {
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
      const type = ["Reimu", "Marisa", "Sakuya"][dat.type] + ["A", "B"][dat.sub];
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
        thprac: user.thprac,
        spell,
        note: user.note,
      };
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
      return {
        game: "th15",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears,
        thprac: user.thprac,
        spell,
        note: user.note,
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
          for (const d of season_powers) {
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
      return {
        game: "th16",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears,
        thprac: user.thprac,
        spell,
        note: user.note,
      };
    }
    case "t17r": {
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
      const dat = th17(rpy);
      const type = ["Reimu", "Marisa", "Youmu"][dat.type] + ["W", "O", "E"][dat.sub];
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
            <td>${j in dat.stages ? dat.stages[j].bomb + "+" + dat.stages[j].biece + "/3" : ""}</td>
          </tr>
        `);
      }
      let clears = "-";
      if (dat.clears >= 1 && dat.clears <= 6) clears = "(" + dat.clears + ")";
      if (dat.clears == 7) clears = "(Ex)";
      if (dat.clears > 7) clears = "(C)";
      const spell = dat.spellNo < 0 ? "" : "No." + (dat.spellNo + 1);
      return {
        game: "th17",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears,
        thprac: user.thprac,
        spell,
        note: user.note,
      };
    }
    case "t18r": {
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
      const dat = th18(rpy);
      const type = ["Reimu", "Marisa", "Sakuya", "Sanae"][dat.type];
      const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra"][dat.difficulty];
      for (const i in dat.stages) {
        const j = +i + 1;
        stages.find("tbody").append(`
          <tr>
            <td>${j < 7 ? j : "Ex"}</td>
            <td>${j in dat.stages ? dat.stages[j].score * 10 : dat.score * 10}</td>
            <td>${j in dat.stages || j === 7 ? dat.stages[i].end_piv * 10 : ""}</td>
            <td>${j in dat.stages || j === 7 ? dat.stages[i].end_graze : ""}</td>
            <td>${j in dat.stages || j === 7 ? (dat.stages[i].end_power / 100).toFixed(2) : ""}</td>
            <td>${j in dat.stages || j === 7 ? dat.stages[i].end_player + "+" + dat.stages[i].end_piece + "/3" : ""}</td>
            <td>${j in dat.stages || j === 7 ? dat.stages[i].end_bomb + "+" + dat.stages[i].end_biece + "/3" : ""}</td>
          </tr>
        `);
      }
      let clears = "-";
      if (dat.clears >= 1 && dat.clears <= 6) clears = "(" + dat.clears + ")";
      if (dat.clears == 7) clears = "(Ex)";
      if (dat.clears > 7) clears = "(C)";
      const spell = dat.spellNo < 0 ? "" : "No." + (dat.spellNo + 1);
      return {
        game: "th18",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: stages.prop("outerHTML").replace(/\s+/g, " "),
        clears,
        thprac: user.thprac,
        spell,
        note: user.note,
      };
    }
    case "t20r": {
      stages.find("thead").html(`
        <tr>
          <th></th>
          <th>Score</th>
          <th>Anomaly Value</th>
          <th>Power</th>
          <th>P</th>
          <th>B</th>
        </tr>
      `);
      const dat = th20(rpy);
      const type = ["Reimu", "Marisa"][dat.type] + ["R1", "R2", "B1", "B2", "Y1", "Y2", "G1", "G2", "C"][dat.sub];
      const difficulty = ["Easy", "Normal", "Hard", "Lunatic", "Extra"][dat.difficulty];
      for (const i in dat.stages) {
        const j = +i + 1;
        stages.find("tbody").append(`
          <tr>
            <td>${j < 7 ? j : "Ex"}</td>
            <td>${j in dat.stages ? dat.stages[j].score * 10 : dat.score * 10}</td>
            <td>${j in dat.stages ? (dat.stages[j].piv / 100).toFixed(2) : ""}</td>
            <td>${j in dat.stages ? (dat.stages[j].power / 100).toFixed(2) : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].player + "+" + dat.stages[j].piece + "/3" : ""}</td>
            <td>${j in dat.stages ? dat.stages[j].bomb + "+" + dat.stages[j].biece + "/3" : ""}</td>
          </tr>
        `);
      }
      let clears = "-";
      if (dat.clears >= 1 && dat.clears <= 6) clears = "(" + dat.clears + ")";
      if (dat.clears == 7) clears = "(Ex)";
      if (dat.clears > 7) clears = "(C)";
      const spell = dat.spellNo < 0 ? "" : "No." + (dat.spellNo + 1);
      return {
        game: "th20",
        name: $("<div>").text(dat.name).html(),
        difficulty,
        type,
        score: dat.score * 10,
        date: dat.date,
        stages: dat.difficulty < 4 ? stages.prop("outerHTML").replace(/\s+/g, " ") : "",
        clears,
        thprac: user.thprac,
        spell,
        note: user.note,
      };
    }
    default:
      return {};
  }
}

function toDetails(str) {
  const s = $("<div>").text(str).html();
  if (new Blob([s]).size <= 32 && !/\n/.test(s)) return s;
  return $("<details>").html(s.replace(/\r?\n/g, "<br>")).prop("outerHTML");
}

// based on https://qiita.com/aKuad/items/2942b85cf0563436e241
async function recEntries(entries) {
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory) {
      const children = await new Promise((r) => {
        entry.createReader().readEntries((e) => { r(e); });
      });
      files.push(...await recEntries(children));
    }
    else {
      const file = await new Promise((r) => {
        entry.file((e) => { r(e); });
      });
      files.push(file);
    }
  }
  return files;
}

function rpytxt(files) {
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
  return files.filter((f) => /\.rpy$/.test(f[1]));
}

$(function () {
  let lastChecked = -1;
  let rpyCnt = 0;

  function updateHeaderCheck() {
    let cnt = 0;
    let cntSel = 0;
    // const cntAll = $(".check").length;
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
    // $("#import").prop("disabled", cntAll);
  }

  $("#table").bind("tablesorter-initialized", function () {
    updateHeaderCheck();
  });

  $("#table").tablesorter({
    theme: 'blue',
    widgets: ["zebra", "filter", "stickyHeaders", "pager"],
    headers: {
      0: { sorter: false },
      6: { sorter: "digit" },
      9: { sorter: false },
      ".lexsort": { sorter: "text" },
    },
    sortStable: true,
    widgetOptions: {
      filter_functions: {
        0: {
          "☑": function (e, n, f, i, $r, c, data) { return $r.find(".check").prop("checked") },
          "☐": function (e, n, f, i, $r, c, data) { return !$r.find(".check").prop("checked") },
        },
        1: true,
        4: true,
        5: true,
        ".dates": function (e, n, f, i, $r, c, data) {
          const s = f.split(/\s+(?:to|-)\s+/);
          if (s.length === 2) {
            return s[0].trim() <= e && e <= s[1].trim();
          }
          return null;
        },
        10: true,
        11: true,
      },
      filter_searchDelay: 0,
      filter_reset: "#resetFilters",
      pager_selectors: {
        container: "#pager",
        first: "#first",
        prev: "#prev",
        next: "#next",
        last: "#last",
        gotoPage: "#gotoPage",
        pageDisplay: "#pageDisplay",
        pageSize: "#pagesize",
      },
      pager_size: 50,
      pager_output: "{startRow} - {endRow} of {filteredRows} / {totalRows}",
      pager_removeRows: true, // a lot of bugs
    },
  });

  function appendRows(rows) {
    rows.find(".check").on("click", function (e) {
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
    $("#rpyInfo").append(rows);
  }

  async function makeRow(file, index) {
    const fDate = formatTime(new Date(file[0].lastModified));
    const dat = await getRpyInfo(file[0], file[1]);
    if (file.length === 3) {
      const txt = new Uint8Array(await file[2].arrayBuffer());
      dat.note = decodeNote(txt);
    }
    const spell = dat.spell ?? "";
    const note = dat.note ?? "";
    const fNote = toDetails(spell + (spell.length && note.length ? "\r\n" : "") + note);
    return `
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
        <td>${fNote}</td>
      </tr>
    `;
  }

  async function inputFiles(files) {
    const len = files.length;
    if (len === 0) return;
    const rows = [];
    for (let i = 0; i < len; i++) {
      $("#pageDisplay").text(`${i + 1}/${len}`);
      rows.push(await makeRow(files[i], rpyCnt + i));
    }
    $("#table").trigger("filterReset").trigger("disablePager");
    appendRows($(rows.join("")));
    rpyCnt += len;
    $("#pageDisplay").empty();
    // $("#table").trigger("update");
    $("#table").trigger("enablePager").trigger("pagerUpdate").trigger("sortReset");
    updateHeaderCheck();
  }

  // $("#export").on("click", function () {
  //   const dat = $("<div>");
  //   $("<div>", { id: "cnt" }).text(rpyCnt).appendTo(dat);
  //   $("#table").clone(false).appendTo(dat);
  //   const xml = new XMLSerializer().serializeToString(new DOMParser().parseFromString(dat.prop("outerHTML"), "text/html"));
  //   const blob = new Blob([xml], { type: "application/xml" });
  //   const url = URL.createObjectURL(blob);
  //   $("<a>", { href: url, download: "replays.xml" })[0].click();
  //   URL.revokeObjectURL(url);
  // });

  // $("#import").on("change", function (e) {
  //   e.target.files[0].text().then((r) => {
  //     appendRows($($(r).find("#rpyInfo").html()));
  //     lastChecked = -1;
  //     rpyCnt = +$(r).find("#cnt").text();
  //     updateHeaderCheck();
  //     $("#table").trigger("update");
  //   });
  // });

  $("#inputFile").on("change", async function (e) {
    if (e.target.webkitEntries.length === 0) {
      const files = Array.from(e.target.files).filter((f) => /\.rpy$|\.txt$/.test(f.name)).map((f) => [f, f.name]);
      inputFiles(rpytxt(files));
      return;
    }
    const entries = await recEntries(e.target.webkitEntries);
    const files = Array.from(entries).filter((f) => /\.rpy$|\.txt$/.test(f.name)).map((f) => [f, f.webkitRelativePath.length ? f.webkitRelativePath : f.name]);
    inputFiles(rpytxt(files));
  });

  $("#inputDir").on("change", function (e) {
    const files = Array.from(e.target.files).filter((f) => /\.rpy$|\.txt$/.test(f.webkitRelativePath)).map((f) => [f, f.webkitRelativePath]);
    inputFiles(rpytxt(files));
  });

  // $("#removeSelected").on("click", function () {
  //   $("#table").trigger("filterReset").trigger("disablePager");
  //   const cRows = $(".check:checked").closest("tr");
  //   const cnt = cRows.length;
  //   if (cnt === 0) {
  //     $("#table").trigger("enablePager").trigger("pagerUpdate");
  //     return;
  //   }
  //   const ok = confirm(`Remove ${cnt} selected items`);
  //   if (!ok) {
  //     $("#table").trigger("enablePager").trigger("pagerUpdate");
  //     return;
  //   }
  //   cRows.remove();
  //   $("#table").trigger("enablePager").trigger("pagerUpdate");
  //   updateHeaderCheck();
  // });

  // $("#removeUnselected").on("click", function () {
  //   $("#table").trigger("filterReset").trigger("disablePager");
  //   const cRows = $(".check:not(:checked)").closest("tr");
  //   const cnt = cRows.length;
  //   if (cnt === 0) {
  //     $("#table").trigger("enablePager").trigger("pagerUpdate");
  //     return;
  //   }
  //   const ok = confirm(`Remove ${cnt} unselected items`);
  //   if (!ok) {
  //     $("#table").trigger("enablePager").trigger("pagerUpdate");
  //     return;
  //   }
  //   cRows.remove();
  //   $("#table").trigger("enablePager").trigger("pagerUpdate");
  //   updateHeaderCheck();
  // });

  $("#checkAll").on("change", function () {
    const checked = $(this).prop("checked");
    $(".check").each(function () {
      if ($(this).is(":hidden")) return true;
      $(this).prop("checked", checked);
    });
    updateHeaderCheck();
  });

  $("#table").bind("filterEnd pagerComplete", function () {
    updateHeaderCheck();
  });
});
