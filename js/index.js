// -------------------------------------------------------------------------------------------------------------
// --- GENERAL -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
const engine = new BrowserEngine("db-dashboard");
const db = new StormDB(engine);

if (db.get("resetDaily").value() === undefined) db.set("resetDaily", '').save();
if (db.get("resetWeekly").value() === undefined) db.set("resetWeekly", '').save();
if (db.get("resetBiMensuel").value() === undefined) db.set("resetBiMensuel", '').save();


var index_perso = 0;
var list_perso = db.get("persos").value();

reset();

$(document).ready(function () {
    dashboard();
});

// Au click sur un lien du menu
$(document).on('click', '.sidebar-link', function () {
    // récupération de la page
    let page = $(this).data('page');

    // Changement du lien du menu qui est sélectionné
    $('.sidebar-link').removeClass('sidebar-link-selected');
    $(this).addClass('sidebar-link-selected');

    // Affichage du contenu approprié
    $('.section-content').hide();
    $(`#section-${page}`).show();

    console.log(page);

    if (page == 'dashboard') dashboard();
    if (page == 'settings') settings();
    if (page == 'gold') gold();
    if (page == 'fate-ember') fate_embers();
    if (page == 'events') events();
    if (page == 'planning') planning();
});
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------



// -------------------------------------------------------------------------------------------------------------
// --- DASHBOARD -----------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
$(document).on('click', '.table-task,.liste-task-no-card', function () {
    let id = $(this).data('id');

    let index = db.get("dashboard").value().findIndex((t) => t.id == id);
    let task = db.get("dashboard").value().find((t) => t.id == id);

    if (task) {
        db.get("dashboard")
            .get(index)
            .get('done')
            .set(parseInt(task.done) + 1);

        db.get("dashboard")
            .get(index)
            .get('count')
            .set(parseInt(task.count) + 1);

        if (task.rest && parseInt(task.rest) >= 20) {
            db.get("dashboard")
                .get(index)
                .get('rest')
                .set(task.rest - 20);
        }

        db.save();

        if (task.revenu > 0 && task.done >= task.repet) {
            let gold_income = {
                'type': 'Raids',
                'description': task.tache_name,
                'categorie': 'revenu',
                'perso': task.perso,
                'montant': task.revenu,
                'date': new Date().toString()
            }

            db.get("gold_income").push(gold_income).save();
            db.get("gold").set(parseInt(db.get("gold").value()) + parseInt(task.revenu)).save();
            db.get("gold_histo").push({ 'date': new Date(), 'label': new Date().toLocaleString(), 'gold': db.get("gold").value() }).save();
        }

        if (task.cout < 0 && task.done >= task.repet) {
            let gold_income = {
                'type': 'Coffre de raids',
                'description': 'Coffre de ' + task.tache_name,
                'categorie': 'depense',
                'perso': task.perso,
                'montant': task.cout,
                'date': new Date().toString()
            }

            db.get("gold_income").push(gold_income).save();
            db.get("gold").set(parseInt(db.get("gold").value()) + parseInt(task.cout)).save();
            db.get("gold_histo").push({ 'date': new Date(), 'label': new Date().toLocaleString(), 'gold': db.get("gold").value() }).save();
        }
    }

    dashboard();
});

function dashboard() {
    // Reset de l'HTML
    $('.dashboard-wrapper').html('');

    // Affichage des cards statistiques
    cardstats();

    // Mise en place de la card image perso
    $('.dashboard-wrapper').append('<div id="image-perso" class="card-content" style="grid-column: 1 / 7; grid-row: 2 / 5;"></div>');
    // Mise en place de la card div perso avec la liste des taches du perso sélectionné
    $('.dashboard-wrapper').append('<div class="card-content" style="grid-column: 1 / 7; grid-row: 5 / 8;"><div id="div-perso" class="scrollhidden" style="height: 100%!important; overflow-y: scroll; display: flex; gap: 0px; flex-direction: column;"></div></div>');

    // Affichage de la liste des taches du perso sélectionné
    list_perso[index_perso] ? showPerso(list_perso[index_perso], db.get("settings").value().dashboard.liste_types_taches_focus_on_carateres) : null;

    $('#image-perso').bind('mousewheel', function (e) {
        if (e.originalEvent.wheelDelta / 120 > 0) {
            if (index_perso > 0) index_perso--;
        }
        else {
            if (index_perso < list_perso.length) index_perso++;
        }

        list_perso[index_perso] ? showPerso(list_perso[index_perso], db.get("settings").value().dashboard.liste_types_taches_focus_on_carateres) : null;
    });

    // Mise en place de la card liste daily
    $('.dashboard-wrapper').append('<div class="card-content" style="grid-column: 7 / 9; grid-row: 2 / 8;"><div id="tasks-by-prio" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>');

    // Mise en place de la card liste weekly
    $('.dashboard-wrapper').append('<div class="card-content" style="grid-column: 9 / 11; grid-row: 2 / 8;"><div id="tasks-weekly-by-prio" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>');

    // Mise en place de la card liste raids
    $('.dashboard-wrapper').append('<div class="card-content" style="grid-column: 11 / 13; grid-row: 2 / 8;"><div id="tasks-raidlegion" class="scrollhidden"style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>');

    showRaid();
    showTasksByPrio();
    showTasksWeeklyByPrio();
}

function cardstats() {
    let dashboard_card_stats = db.get("dashboard_card_stats").value();
    let html = '';

    dashboard_card_stats.forEach(function (card, i) {
        html += `<div class="card-content" style="text-align: center;grid-column: ${card.x} / ${card.x + 2}; grid-row: 1 / 1;">
                    <img style="width: 30%;margin: auto;" src="${card.image}">
                    <p style="white-space: nowrap; overflow-x: hidden;">${card.name} - ${new Intl.NumberFormat('fr-FR').format(getStats(card.tache_name))}</p>
                    <p style="white-space: nowrap; overflow-x: hidden;">${getDone(card.tache_name)} / ${getAll(card.tache_name)}</p>
                    <div class="progress">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${(getDone(card.tache_name) * 100) / getAll(card.tache_name)}%"></div>
                    </div>
                </div>`;
    });

    $('.dashboard-wrapper').append(html);
}

/**
 * Retourne le nombre total de tâches réalisées en fonction du type fournis en entrée
 * 
 * @param {array} tache_name Correspond à la donnée tache_name du fichier json
 * 
 * @returns Le nombre total de tâches
 */
function getStats(tache_name) {
    let total = 0;

    db.get("dashboard").value().forEach(function (task, i) {
        if (task.actif == true && tache_name.includes(task.tache_name)) {
            total += task.count;
        }
    });

    return total;
}

function getDone(tache_name) {
    let total = 0;

    db.get("dashboard").value().forEach(function (task, i) {
        if (task.actif == true && tache_name.includes(task.tache_name) && task.rest >= task.restNeeded) {
            total += task.done;
        }
    });

    return total;
}

function getTodo(tache_name) {
    let total = 0;

    db.get("dashboard").value().forEach(function (task, i) {
        if (task.actif == true && tache_name.includes(task.tache_name) && task.rest >= task.restNeeded) {
            total += (task.repet - task.done);
        }
    });

    return total;
}

function getAll(tache_name) {
    let total = 0;

    db.get("dashboard").value().forEach(function (task, i) {
        if (task.actif == true && tache_name.includes(task.tache_name) && task.rest >= task.restNeeded) {
            let taskrestriction = (db.get("dashboard").value()) ? db.get("dashboard").value().find((t) => t.id == task.restriction) : null;

            if (task.done > 0 || task.restriction === undefined || (task.restriction !== undefined && taskrestriction.done !== taskrestriction.repet)) {
                total += task.repet;
            }
        }
    });

    return total;
}

function showPerso(persos, types) {
    let tasks = (db.get("dashboard").value()) ? db.get("dashboard").value().filter((t) => t.actif == true && types.includes(t.type) && persos.perso.includes(t.perso) && t.done < t.repet && (t.done == 0 && t.rest >= t.restNeeded || t.done > 0) && ((t.type == 'event' && t.horaire.includes(moment().isoWeekday())) || t.type != 'event')) : null;
    let task_remaining = 0;

    if (tasks.length > 0) {
        let html_tables = '';
        let tr_vide = '<tr style="height: 10px;"><td></td><td></td><td></td><td></td><td></td><td></td></tr>';

        tasks.forEach(function (task, i) {
            html_tables += tr_vide;

            html_tables += `
                <tr class="table-task" data-id="${task.id}" style="cursor: pointer; border-radius: 8px; background-color: ${task.reset == 'daily' ? (task.type == 'GR' ? db.get("settings.colors.GR.bg").value() : db.get("settings.colors.daily.bg").value()) : db.get("settings.colors.weekly.bg").value()};color: ${db.get("settings.colors.text").value()};">
                    <td style="border-top-left-radius: 8px;border-bottom-left-radius: 8px;">${task.perso}</td>
                    <td>${task.tache_name}</td>
                    <td style="text-align: center;">${task.done}</td>
                    <td style="text-align: center;">${task.repet - task.done}</td>
                    <td style="text-align: center;">${task.rest > 0 ? task.rest : ''}</td>
                    <td style="text-align: center; border-top-right-radius: 8px;border-bottom-right-radius: 8px;">${task.duration}</td>
                </tr>
            `;

            task_remaining += (task.repet - task.done);
        });

        $('#div-perso').html(`
            <div class="head-task" style="flex: 1;display: flex;justify-content: center;flex-direction: row;background-color: #1e1e1e;text-align: center;position: sticky; top: 0;border-radius: 0px;min-height: 16%;max-height: 16%;gap: 20px;"><img src="${persos.logo}"><div style="display: flex; flex-direction: column; justify-content: center;">${persos.name} ${persos.ilevel}</span><span>Daily todo : ${task_remaining}</span></div></div>
            <table>
                <tr style="background-color: #a1a1a1;color: black;position: sticky;top: 92px;">
                    <th>Perso</th>
                    <th>Task</th>
                    <th>Done</th>
                    <th>Todo</th>
                    <th>Rest</th>
                    <th>Duration</th>
                </tr>
                ${html_tables}
            </table>    
        `);
    } else {
        $('#div-perso').html(`<div class="head-task" style="flex: 1;display: flex;justify-content: center;flex-direction: row;background-color: #1e1e1e;text-align: center;position: sticky; top: 0;border-radius: 0px;min-height: 16%;max-height: 16%;gap: 20px;"><img src="${persos.logo}"><div style="display: flex; flex-direction: column; justify-content: center;">${persos.name} ${persos.ilevel}</span><span>Daily todo : ${task_remaining}</span></div></div>`);
    }

    $('#image-perso').css("background-image", `url(${persos.image})`);
    $('#image-perso').css('background-repeat', 'no-repeat');
    $('#image-perso').css('background-position', 'center');
    $('#image-perso').css('background-size', 'cover');
}

function showRaid() {
    let config_raids = db.get("settings.dashboard.liste_raids").value();
    let html = '';

    config_raids.forEach(function (config_raid, i) {
        let tasks = (db.get("dashboard").value()) ? db.get("dashboard").value().filter((t) => t.actif == true && t.type == config_raid.name && t.done < t.repet) : null;
        let image = `<div class="image-task" style="border-radius: 10px;padding-bottom: 10px;position: sticky; top: 0;"><img style="width: 100%;border-radius: 10px;" src="${config_raid.image}" /></div>`;
        let text_color = db.get("settings.colors.text").value()
        let indeximage = true;

        tasks.forEach(function (task, i) {
            if (task.restriction !== undefined) {
                let taskrestriction = (db.get("dashboard").value()) ? db.get("dashboard").value().find((t) => t.id == task.restriction) : null;

                if (taskrestriction.done !== taskrestriction.repet) {
                    indeximage ? html += image : null;
                    html += `<div class="liste-task-no-card" style="flex: 1;display: flex;justify-content: center;flex-direction: column;" data-id="${task.id}"><span style="color: ${config_raid.color};font-size: 20px;">${task.repet - task.done} - ${task.perso}</span><span style="color: ${text_color};">${task.tache_name}</span>${task.description.length > 0 ? '<span style="color: ' + text_color + ';">' + task.description + '</span>' : ''}</div>`;
                    indeximage = false;
                }
            } else {
                indeximage ? html += image : null;
                html += `<div class="liste-task-no-card" style="flex: 1;display: flex;justify-content: center;flex-direction: column;" data-id="${task.id}"><span style="color: ${config_raid.color};font-size: 20px;">${task.repet - task.done} - ${task.perso}</span><span style="color: ${text_color};">${task.tache_name}</span>${task.description.length > 0 ? '<span style="color: ' + text_color + ';">' + task.description + '</span>' : ''}</div>`;
                indeximage = false;
            }
        });
    });

    $("#tasks-raidlegion").html(html);
}

function showTasksByPrio() {
    let types = db.get("settings.dashboard.prio_task_daily").value();
    let tasks = (db.get("dashboard").value()) ? db.get("dashboard").value().filter((t) => t.actif == true && t.done < t.repet && (t.done == 0 && t.rest >= t.restNeeded || t.done > 0) && (types.includes(t.tache_name)) && ((t.type == 'event' && t.horaire.includes(moment().isoWeekday())) || t.type != 'event')) : null;

    let time_remaining = 0;
    let task_remaining = 0;
    let text_color = db.get("settings.colors.text").value()

    if (tasks.length > 0) {
        let html = '';

        tasks.sort(function (a, b) {
            return a.prio - b.prio;
        });

        tasks.forEach(function (task, i) {
            html += `<div class="liste-task-no-card" style="flex: 1;display: flex;justify-content: center;flex-direction: column;" data-id="${task.id}"><span style="color: ${task.reset == 'daily' ? (task.type == 'GR' ? db.get("settings.colors.GR.text").value() : db.get("settings.colors.daily.text").value()) : db.get("settings.colors.weekly.text").value()};font-size: 20px;">${task.repet - task.done} - ${task.perso}</span><span style="color: ${text_color};">${task.tache_name} ${task.rest > 10 ? ` (${task.rest})` : ''}</span></div>`;
            time_remaining += (task.duration * (task.repet - task.done));
            task_remaining += (task.repet - task.done);
        });

        html = `<div class="histo-task" style="flex: 1;display: flex;justify-content: center;flex-direction: column;background-color: #1e1e1e;text-align: center;position: sticky; top: 0;border-radius: 0px;"><span>Temps restants : ${time_remaining} min</span><span> Daily todo : ${task_remaining}</span></div>` + html;

        $('#tasks-by-prio').html(html);
    } else {
        $('#tasks-by-prio').html('');
    }
}

function showTasksWeeklyByPrio() {
    let types = db.get("settings.dashboard.prio_task_weekly").value();
    let tasks = (db.get("dashboard").value()) ? db.get("dashboard").value().filter((t) => t.actif == true && t.done < t.repet && (types.includes(t.tache_name)) && ((t.type == 'event' && t.horaire.includes(moment().isoWeekday())) || t.type != 'event')) : null;

    let time_remaining = 0;
    let task_remaining = 0;

    if (tasks.length > 0) {
        let html = '';

        tasks.sort(function (a, b) {
            return a.prio - b.prio;
        });

        tasks.forEach(function (task, i) {
            html += `<div class="liste-task-no-card" style="flex: 1;display: flex;justify-content: center;flex-direction: column;" data-id="${task.id}"><span style="color: ${task.color};font-size: 20px;">${task.repet - task.done} - ${task.perso}</span><span style="color: #a1a1a1;">${task.tache_name}</span></div>`;
            time_remaining += (task.duration * (task.repet - task.done));
            task_remaining += (task.repet - task.done);
        });

        html = `<div class="histo-task" style="flex: 1;display: flex;justify-content: center;flex-direction: column;background-color: #1e1e1e;text-align: center;position: sticky; top: 0;border-radius: 0px;"><span>Temps restants : ${time_remaining} min</span><span> Weekly todo : ${task_remaining}</span></div>` + html;

        $('#tasks-weekly-by-prio').html(html);
    } else {
        $('#tasks-weekly-by-prio').html('');
    }
}
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------



// -------------------------------------------------------------------------------------------------------------
// --- GOLD ----------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
var goldchart = null;

function gold() {
    $('.gold-wrapper').html('');

    // Gold
    $('.gold-wrapper').append(`<div id="gold_value" class="card-content" style="grid-column: 1 / 13; grid-row: 1 / 2;"></div>`);

    // Graphique
    $('.gold-wrapper').append(`<div class="card-content" style="grid-column: 1 / 10; grid-row: 2 / 8;"><div id="goldchartdiv" style="flex: 1;height: 100%!important;"></div></div>`);

    // Formulaire
    $('.gold-wrapper').append(`<div id="gold_form" class="card-content" style="grid-column: 1 / 7; grid-row: 8 / 9;"></div>`);
    $('.gold-wrapper').append(`<div id="gold_form_update" class="card-content" style="grid-column: 7 / 10; grid-row: 8 / 9;"></div>`);

    // Revenus
    $('.gold-wrapper').append(`<div class="card-content" style="grid-column: 1 / 4; grid-row: 9 / 16;"><div id="gold_income_revenus" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);
    // Depenses
    $('.gold-wrapper').append(`<div class="card-content" style="grid-column: 4 / 7; grid-row: 9 / 16;"><div id="gold_income_depenses" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);

    // Historique
    $('.gold-wrapper').append(`<div class="card-content" style="grid-column: 7 / 10; grid-row: 9 / 16;"><div id="historique_gold_income" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);

    // Rentabilite perso
    $('.gold-wrapper').append(`<div class="card-content" style="grid-column: 10 / 13; grid-row: 2 / 4;"><div id="gold_income_roster" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);
    $('.gold-wrapper').append(`<div class="card-content" style="grid-column: 10 / 13; grid-row: 4 / 6;"><div id="gold_income_jeresayaya" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);
    $('.gold-wrapper').append(`<div class="card-content" style="grid-column: 10 / 13; grid-row: 6 / 8;"><div id="gold_income_jeresunshine" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);
    $('.gold-wrapper').append(`<div class="card-content" style="grid-column: 10 / 13; grid-row: 8 / 10;"><div id="gold_income_jerescelestia" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);
    $('.gold-wrapper').append(`<div class="card-content" style="grid-column: 10 / 13; grid-row: 10 / 12;"><div id="gold_income_jeresbard" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);
    $('.gold-wrapper').append(`<div class="card-content" style="grid-column: 10 / 13; grid-row: 12 / 14;"><div id="gold_income_jeresakura" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);
    $('.gold-wrapper').append(`<div class="card-content" style="grid-column: 10 / 13; grid-row: 14 / 16;"><div id="gold_income_imanyrae" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);

    goldChart();
    goldformulaire();
    goldHistorique();
    goldRevenusDepenses();
    goldValue();
    goldRentabilitePerso();
}

function goldChart() {
    // Destruction du graphique s'il existe
    if (goldchart) goldchart.destroy();

    // Création du canvas
    $('#goldchartdiv').html(`<canvas id="goldchart" style="height:100%!important;width:100%!important;margin: auto;"></canvas>`);

    // Récupération du context
    let ctxgold = document.getElementById("goldchart").getContext("2d");

    goldchart = new Chart(ctxgold, {
        type: 'line',
        data: {
            labels: getLabelGoldChart(),
            datasets: [{
                label: 'Gold',
                data: getValueGoldChart(),
                fill: true,
                borderColor: 'rgb(255, 229, 153)',
                backgroundColor: 'rgba(255, 229, 153, 0.5)',
                tension: 0.3
            }]
        },
        options: {
            scales: {
                x: {
                    display: true,
                    stacked: true,
                    color: '#FFFFFF',
                    grid: {
                        display: false,
                        color: '#858585'
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 5,
                        labelOffset: 80
                    },
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    color: '#FFFFFF',
                    grid: {
                        display: true,
                        color: '#333333',
                        drawOnChartArea: true,
                        drawTicks: false
                    }
                }
            },
            animation: {
                duration: 0
            },
            elements: {
                point: {
                    radius: 0
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                }
            }
        },
    });

}

function getLabelGoldChart() {
    let gold_histo = (db.get("gold_histo").value()) ? db.get("gold_histo").value() : null;
    let labels = [];

    gold_histo.sort(function (a, b) {
        return new Date(a.date) - new Date(b.date);
    });

    gold_histo.forEach(function (histo, i) {
        labels.push(histo.label);
    });

    return labels;
}

function getValueGoldChart() {
    let gold_histo = (db.get("gold_histo").value()) ? db.get("gold_histo").value() : null;
    let values = [];

    gold_histo.sort(function (a, b) {
        return new Date(a.date) - new Date(b.date);
    });

    gold_histo.forEach(function (histo, i) {
        values.push(histo.gold);
    });

    return values;
}

function goldformulaire() {
    let html_options_gold_income = '';
    let html_options_perso = '';

    db.get("settings.gold.options_gold_income").value().forEach(function (g, i) {
        html_options_gold_income += `<option>${g}</option>`;
    });

    db.get("persos").value().forEach(function (p, i) {
        html_options_perso += `<option>${p.name}</option>`;
    });

    $('#gold_form').html(`
        <div style="text-align: center;">Formulaire</div>
        <div class="d-flex flex-row justify-content-center flex-nowrap gap-3" style="padding: 5px;">
            <input list="gold_income_type_list" class="form-control flex-grow-1" id="gold_income_type"
                style="background-color: #202020;color: white;" placeholder="Gold Income">

            <datalist id="gold_income_type_list">
                ${html_options_gold_income}
            </datalist>

            <input id="gold_income_description" class="form-control flex-grow-1"
                style="background-color: #202020;color: white;" placeholder="Description">

            <input list="gold_income_perso_list" class="form-control flex-grow-1" id="gold_income_perso"
                style="background-color: #202020;color: white;" placeholder="Roster">

            <datalist id="gold_income_perso_list">
                ${html_options_perso}
            </datalist>

            <input type="number" class="form-control flex-shrink-1" id="gold_income_montant"
                style="background-color: #202020;color: white;width: auto;" placeholder="Montant">

            <button id="add_gold_income" type="button" class="btn btn-outline-light flex-shrink-1">Ajouter</button>
        </div>
    `);

    $('#gold_form_update').html(`
        <div style="text-align: center;">Mise &agrave; jour</div>
        <div class="d-flex flex-row justify-content-center flex-nowrap gap-3" style="padding: 5px;">
            <input type="number" class="form-control flex-shrink-1" id="gold_income_montant_update"
                style="background-color: #202020;color: white;width: auto;" placeholder="Gold Actuel">

            <button id="update_gold_income" type="button" class="btn btn-outline-light flex-shrink-1">Update</button>
        </div>
    `);
}

$(document).on('click', '#add_gold_income', function () {
    let type = $('#gold_income_type').val();
    let description = $('#gold_income_description').val();
    let perso = $('#gold_income_perso').val();
    let montant = $('#gold_income_montant').val();

    let gold_income = {
        'type': type,
        'description': description,
        'categorie': (montant > 0 ? 'revenu' : 'depense'),
        'perso': perso,
        'montant': parseInt(montant),
        'date': new Date().toString()
    }

    db.get("gold_income").push(gold_income).save();
    db.get("gold").set(parseInt(db.get("gold").value()) + parseInt(montant)).save();
    db.get("gold_histo").push({ 'date': new Date(), 'label': new Date().toLocaleString(), 'gold': db.get("gold").value() }).save();

    gold();
});

$(document).on('click', '#update_gold_income', function () {
    let gold_actuel = $('#gold_income_montant_update').val();
    let montant = parseInt(gold_actuel) - parseInt(db.get("gold").value());

    let gold_income = {
        'type': 'Update',
        'description': '',
        'categorie': (montant > 0 ? 'revenu' : 'depense'),
        'perso': 'Roster',
        'montant': parseInt(montant),
        'date': new Date().toString()
    }

    db.get("gold_income").push(gold_income).save();
    db.get("gold").set(parseInt(db.get("gold").value()) + parseInt(montant)).save();
    db.get("gold_histo").push({ 'date': new Date(), 'label': new Date().toLocaleString(), 'gold': db.get("gold").value() }).save();

    gold();
});

function goldHistorique() {
    let gold_incomes = (db.get("gold_income").value()) ? db.get("gold_income").value() : null;

    if (gold_incomes.length > 0) {
        let html = '';

        let bg_color = '';
        let color = '';

        gold_incomes.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date) || a.type.localeCompare(b.type) || b.perso - a.perso;
        });

        gold_incomes.forEach(function (gold_income, i) {
            if (gold_income.montant > 0) {
                bg_color = '00b135';
                color = 'FFF';
            } else {
                bg_color = 'cf4747';
                color = 'FFF';
            }

            html += `<div class="histo-task" style="color: white;flex: 1;display: flex;justify-content: center;flex-direction: column;"><span style="color: #${bg_color};font-size: x-large;">${gold_income.montant > 0 ? '+' : ''}${new Intl.NumberFormat('fr-FR').format(gold_income.montant)} Golds</span><span>${gold_income.type}</span>${gold_income.description ? `<span>${gold_income.description}</span>` : ''}<span style="color: #a1a1a1;">${gold_income.perso}</span><span style="color: #a1a1a1;">le ${new Date(gold_income.date).toLocaleDateString()}</span></div>`;
        });

        $('#historique_gold_income').html(html);
    } else {
        $('#historique_gold_income').html('');
    }
}

function goldRevenusDepenses() {
    let gold_incomes = (db.get("gold_income").value()) ? db.get("gold_income").value() : null;
    let gold_incomes_groupby_types = Object.groupBy(gold_incomes, ({ type }) => type);
    let gold_incomes_group_total_revenus = [];
    let gold_incomes_group_total_depenses = [];

    Object.entries(gold_incomes_groupby_types).forEach(function (gold_income_group, i) {
        let total = 0;

        gold_income_group[1].forEach(function (g, i) {
            total += g.montant;
        });

        if (total >= 0) gold_incomes_group_total_revenus.push({ "type": gold_income_group[0], "montant": total });
        else gold_incomes_group_total_depenses.push({ "type": gold_income_group[0], "montant": total });
    });

    gold_incomes_group_total_revenus.sort(function (a, b) {
        return b.montant - a.montant;
    });

    gold_incomes_group_total_depenses.sort(function (a, b) {
        return a.montant - b.montant;
    });

    let html_revenus = '';
    let html_depenses = '';
    let bg_color = '';
    let color = '';
    let total_revenus = 0;
    let total_depenses = 0;

    gold_incomes_group_total_revenus.forEach(function (g, i) {
        bg_color = '00b135';
        color = 'FFF';
        total_revenus += g.montant;
        html_revenus += `<div class="histo-task" style="color: white;flex: 1;display: flex;justify-content: center;flex-direction: column;"><span style="color: #${bg_color};font-size: x-large;">${g.montant > 0 ? '+' : ''}${new Intl.NumberFormat('fr-FR').format(g.montant)} Golds</span><span>${g.type}</span></div>`;
    });

    gold_incomes_group_total_depenses.forEach(function (g, i) {
        bg_color = 'cf4747';
        color = 'FFF';
        total_depenses += g.montant;
        html_depenses += `<div class="histo-task" style="color: white;flex: 1;display: flex;justify-content: center;flex-direction: column;"><span style="color: #${bg_color};font-size: x-large;">${g.montant > 0 ? '+' : ''}${new Intl.NumberFormat('fr-FR').format(g.montant)} Golds</span><span>${g.type}</span></div>`;
    });

    $('#gold_income_revenus').html(`
        <div class="histo-task" style="flex: 1;display: flex;justify-content: center;flex-direction: column;background-color: #1e1e1e;color: #00b135;font-size: 26px;text-align: center;position: sticky; top: 0;border-radius: 0px;min-height: 10%;max-height: 10%;">
            <span>Revenus : +${new Intl.NumberFormat('fr-FR').format(total_revenus)} Golds</span>
        </div>
        ${html_revenus}
    `);

    $('#gold_income_depenses').html(`
        <div class="histo-task" style="flex: 1;display: flex;justify-content: center;flex-direction: column;background-color: #1e1e1e;color: #cf4747;font-size: 26px;text-align: center;position: sticky; top: 0;border-radius: 0px;min-height: 10%;max-height: 10%;">
            <span>D&eacute;penses : ${new Intl.NumberFormat('fr-FR').format(total_depenses)} Golds</span>
        </div>
        ${html_depenses}
    `);
}

function goldValue() {
    let last_reset = moment(db.get("resetWeekly").value(), 'DD-MM-YYYY').toDate();
    let gold_histo_last_reset = db.get("gold_histo").value().find(function (h) { return new Date(h.date) >= last_reset });

    $('#gold_value').html(`
        <div class="" style="display: flex;justify-content: center;align-items: center;height: 100%;font-size: 32px;">
            <span>${new Intl.NumberFormat('fr-FR').format(db.get("gold").value())} Golds&nbsp;&nbsp;&nbsp;${gold_histo_last_reset.gold > db.get("gold").value() ? `<span style="color: #cf4747;font-size: 24px;"><i class="fa-solid fa-arrow-trend-down"></i>` : `<span style="color: #00b135;font-size: 24px;"><i class="fa-solid fa-arrow-trend-up"></i>`}&nbsp;${(((db.get("gold").value() * 100) / gold_histo_last_reset.gold) - 100).toFixed(2)}%</span></span>
        </div>
    `);
}

function goldRentabilitePerso() {
    let gold_incomes = (db.get("gold_income").value()) ? db.get("gold_income").value() : null;
    let gold_incomes_groupby_persos = Object.groupBy(gold_incomes, ({ perso }) => perso);
    let gold_incomes_group_total = [];

    console.log(gold_incomes_groupby_persos);

    Object.entries(gold_incomes_groupby_persos).forEach(function (gold_income_group, i) {
        let total = 0;

        gold_income_group[1].forEach(function (g, i) {
            total += g.montant;
        });

        gold_incomes_group_total.push({ "perso": gold_income_group[0], "montant": total });
    });

    console.log(gold_incomes_group_total);
    console.log(list_perso)

    gold_incomes_group_total.forEach(function (g, i) {
        let perso = list_perso.find((p) => p.name == g.perso);
        console.log(perso)

        $(`#${perso.page_gold_div_rentabilite}`).html(`
            <div class="head-task" style="flex: 1;display: flex;justify-content: center;flex-direction: row;background-color: #1e1e1e;text-align: center;position: sticky; top: 0;border-radius: 0px;min-height: 40%;max-height: 40%;gap: 20px;"><img src="${perso.logo}"><div style="display: flex; flex-direction: column; justify-content: center;">${perso.name} ${perso.ilevel}</span></div></div>
            <div class="histo-task" style="color: white;flex: 1;display: flex;justify-content: center;flex-direction: column;text-align: center;"><span style="color: #${g.montant >= 0 ? '00b135' : 'cf4747'};font-size: x-large;">${g.montant > 0 ? '+' : ''}${new Intl.NumberFormat('fr-FR').format(g.montant)} Golds</span></div>
        `);
    });
}
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------



// -------------------------------------------------------------------------------------------------------------
// --- FATE EMBER ----------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
var fateemberbar = null;
var fateemberpie = null;

function fate_embers() {
    $('.fate-ember-wrapper').html('');

    // Historique
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 1 / 5; grid-row: 1 / 11;"><div id="historique_fate_ember" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);

    // Cards Stats Type
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 5 / 7; grid-row: 1 / 3;"><div id="fate_ember_stats" style="flex: 1;height: 100%!important;"></div></div>`);
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 7 / 9; grid-row: 1 / 3;"><div id="fate_ember_stats_silver" style="flex: 1;height: 100%!important;"></div></div>`);
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 9 / 11; grid-row: 1 / 3;"><div id="fate_ember_stats_golds" style="flex: 1;height: 100%!important;"></div></div>`);
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 11 / 13; grid-row: 1 / 3;"><div id="fate_ember_stats_xpcardpack" style="flex: 1;height: 100%!important;"></div></div>`);
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 13 / 15; grid-row: 1 / 3;"><div id="fate_ember_stats_honingchest" style="flex: 1;height: 100%!important;"></div></div>`);
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 15 / 17; grid-row: 1 / 3;"><div id="fate_ember_stats_cardpack" style="flex: 1;height: 100%!important;"></div></div>`);

    // Graphique en bars
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 5 / 13; grid-row: 3 / 9;"><div id="fate_ember_bar_chart_div" style="flex: 1;height: 100%!important;"></div></div>`);

    // Graphique en pie
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 13 / 17; grid-row: 3 / 6;"><div id="fate_ember_pie_chart_div" style="flex: 1;height: 100%!important;"></div></div>`);

    // Formulaire
    $('.fate-ember-wrapper').append(`<div id="fate_ember_form" class="card-content" style="grid-column: 13 / 17; grid-row: 6 / 9;"></div>`);

    // Cards Stats Perso
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 5 / 7; grid-row: 9 / 11;"><div id="fate_ember_stats_jeresayaya" style="flex: 1;height: 100%!important;"></div></div>`);
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 7 / 9; grid-row: 9 / 11;"><div id="fate_ember_stats_jeresunshine" style="flex: 1;height: 100%!important;"></div></div>`);
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 9 / 11; grid-row: 9 / 11;"><div id="fate_ember_stats_jerescelestia" style="flex: 1;height: 100%!important;"></div></div>`);
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 11 / 13; grid-row: 9 / 11;"><div id="fate_ember_stats_jeresbard" style="flex: 1;height: 100%!important;"></div></div>`);
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 13 / 15; grid-row: 9 / 11;"><div id="fate_ember_stats_jeresakura" style="flex: 1;height: 100%!important;"></div></div>`);
    $('.fate-ember-wrapper').append(`<div class="card-content" style="grid-column: 15 / 17; grid-row: 9 / 11;"><div id="fate_ember_stats_imanyrae" style="flex: 1;height: 100%!important;"></div></div>`);

    fateEmbersHistorique();
    fateEmbersCharts();
    fateEmbersForm();
    fateEmbersStats();
}

function fateEmbersHistorique() {
    let fate_embers = (db.get("fate_embers").value()) ? db.get("fate_embers").value() : null;

    let silver = ['500K_Silver', '1M_Silver', '2M_Silver'];
    let gold = ['1500_Gold', '3K_Gold', '10K_Gold', '20K_Gold', '50K_Gold', '100K_Gold'];
    let xpcardpack = ['normal_xpcardpack', 'lucky_xpcardpack', 'special_xpcardpack', 'premium_xpcardpack'];
    let honingchest = ['S_Honingchest', 'M_Honingchest', 'L_Honingchest'];
    let cardpack = ['Epic_CardPack', 'RandomLeg_CardPack', 'SelectLeg_CardPack'];

    db.get("settings.fate_embers.options_fate_embers").value().forEach(function (fe, i) {
        if (fe.categorie == 'Silver') {
            fe.values.forEach(function (type, i) {
                silver.push(type + ' ' + fe.categorie);
            });
        }

        if (fe.categorie == 'Golds') {
            fe.values.forEach(function (type, i) {
                gold.push(type + ' ' + fe.categorie);
            });
        }

        if (fe.categorie == 'Xp Card Pack') {
            fe.values.forEach(function (type, i) {
                xpcardpack.push(type + ' ' + fe.categorie);
            });
        }

        if (fe.categorie == 'Honing Chest') {
            fe.values.forEach(function (type, i) {
                honingchest.push(type + ' ' + fe.categorie);
            });
        }

        if (fe.categorie == 'Card Pack') {
            fe.values.forEach(function (type, i) {
                cardpack.push(type + ' ' + fe.categorie);
            });
        }
    });

    if (fate_embers.length > 0) {
        let html = ``;
        let bg_color = '';
        let color = '';

        fate_embers.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date) || a.type.localeCompare(b.type) || b.perso - a.perso;
        });

        fate_embers.forEach(function (fate_ember, i) {
            if (silver.includes(fate_ember.type)) {
                bg_color = 'd9d9d9';
                color = '000';
            }

            if (gold.includes(fate_ember.type)) {
                bg_color = 'ffe599';
                color = '000';
            }

            if (xpcardpack.includes(fate_ember.type)) {
                bg_color = 'f6b26b';
                color = '000';
            }

            if (honingchest.includes(fate_ember.type)) {
                bg_color = 'a4c2f4';
                color = '000';
            }

            if (cardpack.includes(fate_ember.type)) {
                bg_color = 'd5a6bd';
                color = '000';
            }

            html += `<div class="histo-task" style="flex: 1;display: flex;justify-content: center;flex-direction: column;"><span style="color: #${bg_color};font-size: 20px;">${fate_ember.type}</span><span style="color: #a1a1a1;">${fate_ember.perso}</span><span style="color: #a1a1a1;">le ${new Date(fate_ember.date).toLocaleDateString()}</span></div>`;
        });

        $('#historique_fate_ember').html(html);
    } else {
        $('#historique_fate_ember').html('');
    }
}

function fateEmbersCharts() {
    // Destruction des graphiques s'ils existent
    if (fateemberbar) fateemberbar.destroy();
    if (fateemberpie) fateemberpie.destroy();

    // Création des canvas
    $('#fate_ember_bar_chart_div').html(`<canvas id="fate_ember_bar_chart" style="height:100%!important;width:100%!important;margin: auto;"></canvas>`);
    $('#fate_ember_pie_chart_div').html(`<canvas id="fate_ember_pie_chart" style="height:100%!important;width:100%!important;margin: auto;"></canvas>`);

    // Récupération des contexts
    let ctxfateemberbar = document.getElementById("fate_ember_bar_chart").getContext("2d");
    let ctxfateemberpie = document.getElementById("fate_ember_pie_chart").getContext("2d");

    fateemberbar = new Chart(ctxfateemberbar, {
        type: 'bar',
        data: {
            labels: [
                'Silver',
                'Golds',
                'Card XP',
                'Honing',
                'Card Pack'
            ],
            datasets: [
                {
                    label: '500K Silver',
                    data: [
                        nbfateember('500K_Silver') + nbfateember('500K Silver'), 0, 0, 0, 0
                    ],
                    backgroundColor: 'rgba(217, 217, 217, 0.2)',
                    borderColor: 'rgb(217, 217, 217)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: '1M Silver',
                    data: [
                        nbfateember('1M_Silver') + nbfateember('1M Silver'), 0, 0, 0, 0
                    ],
                    backgroundColor: 'rgba(217, 217, 217, 0.5)',
                    borderColor: 'rgb(217, 217, 217)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: '2M Silver',
                    data: [
                        nbfateember('2M_Silver') + nbfateember('2M Silver'), 0, 0, 0, 0
                    ],
                    backgroundColor: 'rgba(217, 217, 217, 0.8)',
                    borderColor: 'rgb(217, 217, 217)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: '1500 Golds',
                    data: [
                        0, nbfateember('1500_Gold') + nbfateember('1500 Gold'), 0, 0, 0
                    ],
                    backgroundColor: 'rgba(255, 229, 153, 0.3)',
                    borderColor: 'rgb(255, 229, 153)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: '3K Golds',
                    data: [
                        0, nbfateember('3K_Gold') + nbfateember('3K Gold'), 0, 0, 0
                    ],
                    backgroundColor: 'rgba(255, 229, 153, 0.4)',
                    borderColor: 'rgb(255, 229, 153)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: '10K Golds',
                    data: [
                        0, nbfateember('10K_Gold') + nbfateember('10K Gold'), 0, 0, 0
                    ],
                    backgroundColor: 'rgba(255, 229, 153, 0.5)',
                    borderColor: 'rgb(255, 229, 153)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: '20K Golds',
                    data: [
                        0, nbfateember('20K_Gold') + nbfateember('20K Gold'), 0, 0, 0
                    ],
                    backgroundColor: 'rgba(255, 229, 153, 0.6)',
                    borderColor: 'rgb(255, 229, 153)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: '50K Golds',
                    data: [
                        0, nbfateember('50K_Gold') + nbfateember('50K Gold'), 0, 0, 0
                    ],
                    backgroundColor: 'rgba(255, 229, 153, 0.7)',
                    borderColor: 'rgb(255, 229, 153)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: '100K Golds',
                    data: [
                        0, nbfateember('100K_Gold') + nbfateember('100K Gold'), 0, 0, 0
                    ],
                    backgroundColor: 'rgba(255, 229, 153, 0.8)',
                    borderColor: 'rgb(255, 229, 153)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: 'Normal Xp Card Pack',
                    data: [
                        0, 0, nbfateember('normal_xpcardpack') + nbfateember('Normal Xp Card Pack'), 0, 0
                    ],
                    backgroundColor: 'rgba(246, 178, 107, 0.5)',
                    borderColor: 'rgb(246, 178, 107)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: 'Lucky Xp Card Pack',
                    data: [
                        0, 0, nbfateember('lucky_xpcardpack') + nbfateember('Lucky Xp Card Pack'), 0, 0
                    ],
                    backgroundColor: 'rgba(246, 178, 107, 0.6)',
                    borderColor: 'rgb(246, 178, 107)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: 'Special Xp Card Pack',
                    data: [
                        0, 0, nbfateember('special_xpcardpack') + nbfateember('Special Xp Card Pack'), 0, 0
                    ],
                    backgroundColor: 'rgba(246, 178, 107, 0.7)',
                    borderColor: 'rgb(246, 178, 107)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: 'Premium Xp Card Pack',
                    data: [
                        0, 0, nbfateember('premium_xpcardpack') + nbfateember('Premium Xp Card Pack'), 0, 0
                    ],
                    backgroundColor: 'rgba(246, 178, 107, 0.8)',
                    borderColor: 'rgb(246, 178, 107)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: 'S Honingchest',
                    data: [
                        0, 0, 0, nbfateember('S_Honingchest') + nbfateember('S Honingchest'), 0
                    ],
                    backgroundColor: 'rgba(164, 194, 244, 0.5)',
                    borderColor: 'rgb(164, 194, 244)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: 'M Honingchest',
                    data: [
                        0, 0, 0, nbfateember('M_Honingchest') + nbfateember('M Honingchest'), 0
                    ],
                    backgroundColor: 'rgba(164, 194, 244, 0.6)',
                    borderColor: 'rgb(164, 194, 244)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: 'L Honingchest',
                    data: [
                        0, 0, 0, nbfateember('L_Honingchest') + nbfateember('L Honingchest'), 0
                    ],
                    backgroundColor: 'rgba(164, 194, 244, 0.7)',
                    borderColor: 'rgb(164, 194, 244)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: 'Epic Card Pack',
                    data: [
                        0, 0, 0, 0, nbfateember('Epic_CardPack') + nbfateember('Epic Card Pack')
                    ],
                    backgroundColor: 'rgba(213, 166, 189, 0.5)',
                    borderColor: 'rgb(213, 166, 189)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: 'Random Legendary Card Pack',
                    data: [
                        0, 0, 0, 0, nbfateember('RandomLeg_CardPack') + nbfateember('Random Legendary Card Pack')
                    ],
                    backgroundColor: 'rgba(213, 166, 189, 0.7)',
                    borderColor: 'rgb(213, 166, 189)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: 'Selection Legendary Card Pack',
                    data: [
                        0, 0, 0, 0, nbfateember('SelectLeg_CardPack') + nbfateember('Selection Legendary Card Pack')
                    ],
                    backgroundColor: 'rgba(213, 166, 189, 0.8)',
                    borderColor: 'rgb(213, 166, 189)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
            ]
        },
        options: {
            animation: {
                duration: 0
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    stacked: true,
                    color: '#FFFFFF',
                    grid: {
                        display: false,
                        color: '#858585'
                    }
                },
                y: {
                    display: true,
                    stacked: true,
                    beginAtZero: true,
                    color: '#FFFFFF',
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,
                }
            }
        },
    });

    fateemberpie = new Chart(ctxfateemberpie, {
        type: 'pie',
        data: {
            labels: [
                'Silver',
                'Gold',
                'Card XP',
                'Honing',
                'Card'
            ],
            datasets: [{
                label: 'Fate Embers',
                data: [
                    ((nbfateember('500K_Silver') * 0.5) + nbfateember('1M_Silver') + (nbfateember('2M_Silver') * 2)),
                    ((nbfateember('1500_Gold') * 0.15) + (nbfateember('3K_Gold') * 0.3) + nbfateember('10K_Gold') + (nbfateember('20K_Gold') * 2) + (nbfateember('50K_Gold') * 5) + (nbfateember('100K_Gold') * 10)),
                    (nbfateember('normal_xpcardpack') + (nbfateember('lucky_xpcardpack') * 2) + (nbfateember('special_xpcardpack') * 3) + (nbfateember('premium_xpcardpack') * 5)),
                    ((nbfateember('S_Honingchest') * 0.5) + (nbfateember('M_Honingchest') * 1) + (nbfateember('L_Honingchest') * 2)),
                    nbfateember('Epic_CardPack') + nbfateember('RandomLeg_CardPack') + nbfateember('SelectLeg_CardPack')
                ],
                backgroundColor: [
                    'rgba(217, 217, 217, 0.5)',
                    'rgba(255, 229, 153, 0.5)',
                    'rgba(246, 178, 107, 0.5)',
                    'rgba(164, 194, 244, 0.5)',
                    'rgba(213, 166, 189, 0.5)',
                ],
                borderColor: [
                    'rgb(217, 217, 217)',
                    'rgb(255, 229, 153)',
                    'rgb(246, 178, 107)',
                    'rgb(164, 194, 244)',
                    'rgb(213, 166, 189)',
                ]
            }]
        },
        options: {
            animation: {
                duration: 0
            },
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        label: (data) => {
                            // console.log(data)

                            if (data.label == 'Silver') return ' ' + data.raw + ' M ' + data.label;
                            if (data.label == 'Gold') return ' ' + (data.raw * 10) + ' K ' + data.label;
                            if (data.label == 'Card XP') return ' ' + (data.raw * 18000) + ' ' + data.label;
                            if (data.label == 'Honing') return ' ' + (data.raw * 9000) + 'S - ' + (data.raw * 30) + 'L - ' + (data.raw * 700) + 'W - ' + (data.raw * 1400) + 'A';
                            if (data.label == 'Card') return ' ' + data.raw + ' Paquets';

                            return data.raw + ' M ' + data.label;
                        },
                    }
                }
            }
        },
    });
}

function nbfateember(type) {
    let fate_embers = (db.get("fate_embers").value()) ? db.get("fate_embers").value().filter((t) => t.type == type) : null;

    return parseInt(fate_embers.length);
}

function nbfateemberPerso(perso) {
    let fate_embers = (db.get("fate_embers").value()) ? db.get("fate_embers").value().filter((t) => t.perso == perso) : null;

    return parseInt(fate_embers.length);
}

function fateEmbersForm() {
    let html_options_fate_ember = '';
    let html_options_perso = '';

    db.get("settings.fate_embers.options_fate_embers").value().forEach(function (fe, i) {
        html_options_fate_ember += `<optgroup label="${fe.categorie}">`;

        fe.values.forEach(function (val, i) {
            html_options_fate_ember += `<option value="${val + ' ' + fe.categorie}">${val}</option>`;
        });

        html_options_fate_ember += `</optgroup>`;
    });

    db.get("persos").value().forEach(function (p, i) {
        html_options_perso += `<option>${p.name}</option>`;
    });

    $('#fate_ember_form').html(`
        <div class="" style="display: flex;justify-content: center;align-items: center;height: 100%;">
            <div class="flex-grow-1">
                <div style="text-align: center;">Formulaire</div>
                <br>
                <div class="d-flex flex-column justify-content-center flex-nowrap gap-3" style="padding: 5px;">
                    <select id="fate_ember_type" class="form-select task-grid-card" style="background-color: #202020;color: white;">
                        ${html_options_fate_ember}
                    </select>
        
                    <select id="fate_ember_perso" class="form-select task-grid-card" style="background-color: #202020;color: white;">
                        ${html_options_perso}
                    </select>
        
                    <button id="add_fate_ember" type="button" class="btn btn-outline-light task-grid-card" style="width: 100%;">Ajouter</button>
                </div>
            </div>
        </div>
    `);
}

function fateEmbersStats() {
    db.get("settings.fate_embers.cards_stats.types").value().forEach(function (c, i) {
        let total = 0;

        c.liste_type.forEach(function(t, i) {
            total += nbfateember(t);
        });

        $(`#${c.div}`).html(`
            <div class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;justify-content: center;text-align: center;">
                <img style="width: 50%;margin: auto;border-radius: 8px;" src="${c.image}" />
                <p>${c.name}</p>
                <p style="font-size: 28px;">${total}</p>
            </div>
        `);
    });

    db.get("settings.fate_embers.cards_stats.persos").value().forEach(function (c, i) {
        $(`#${c.div}`).html(`
            <div class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;justify-content: center;text-align: center;">
                <img style="width: 50%;margin: auto;border-radius: 8px;" src="${c.image}" />
                <p>${c.name}</p>
                <p style="font-size: 28px;">${nbfateemberPerso(c.name)}</p>
            </div>
        `);
    });
}

$(document).on('click', '#add_fate_ember', function () {
    let types_gold = [];

    db.get("settings.fate_embers.options_fate_embers").value().forEach(function (fe, i) {
        if (fe.categorie == 'Golds') {
            fe.values.forEach(function (type, i) {
                types_gold.push(type + ' ' + fe.categorie);
            });
        }
    });

    let type = $('#fate_ember_type').val();
    let perso = $('#fate_ember_perso').val();

    let fate_ember = {
        'type': type,
        'perso': perso,
        'date': new Date().toString()
    }

    db.get("fate_embers").push(fate_ember).save();

    if (types_gold.includes(fate_ember.type)) {
        let gold = 0;

        switch (fate_ember.type) {
            case '1500 Golds':
                gold = 1500;

                break;
            case '3000 Golds':
                gold = 3000;

                break;
            case '10K Golds':
                gold = 10000;

                break;
            case '20K Golds':
                gold = 20000;

                break;
            case '50K Golds':
                gold = 50000;

                break;
            case '100K Golds':
                gold = 100000;

                break;

            default:
                break;
        }

        let gold_income = {
            'type': 'Fate Ember',
            'categorie': 'revenu',
            'perso': perso,
            'montant': parseInt(gold),
            'date': new Date().toString()
        }

        db.get("gold_income").push(gold_income).save();
        db.get("gold").set(parseInt(db.get("gold").value()) + parseInt(gold)).save();
        db.get("gold_histo").push({ 'date': new Date(), 'label': new Date().toLocaleString(), 'gold': db.get("gold").value() }).save();
    }

    fate_embers();
});
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------



// -------------------------------------------------------------------------------------------------------------
// --- EVENTS --------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
function events() {
    $('.events-wrapper').html('');

    // Timeline
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 1 / 7; grid-row: 1 / 11;"><div id="timeline_objectifs" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);

    // Formulaire
    $('.events-wrapper').append(`<div id="events_form" class="card-content" style="grid-column: 7 / 17; grid-row: 1 / 2;"></div>`);

    // Objectifs
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 7 / 17; grid-row: 2 / 5;"><div id="events_objectifs" class="scrollhidden" style="display: flex; flex-direction: row;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);

    // Persos
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 7 / 12; grid-row: 5 / 7;"></div>`);
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 7 / 12; grid-row: 7 / 9;"></div>`);
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 7 / 12; grid-row: 9 / 11;"></div>`);
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 12 / 17; grid-row: 5 / 7;"></div>`);
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 12 / 17; grid-row: 7 / 9;"></div>`);
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 12 / 17; grid-row: 9 / 11;"></div>`);

    eventsFormulaire();
    objectifs();
    timeline();
}

function eventsFormulaire() {
    // perso (roster 6)
    // categorie (honing, elixir, roster, gear, ...)
    // description (nom de l'objectif)
    // date
    // logo ? en lien avec la categorie ?
    // status (todo, done)

    let html_options_perso = '';
    let html_options_categorie = '';

    db.get("persos").value().forEach(function (p, i) {
        html_options_perso += `<option>${p.name}</option>`;
    });

    db.get("settings.events.categories").value().forEach(function (p, i) {
        html_options_categorie += `<option>${p.name}</option>`;
    });

    $('#events_form').html(`
        <div style="text-align: center;">Formulaire</div><br>
        <div class="d-flex flex-row justify-content-center flex-nowrap gap-3" style="padding: 5px;">
            <input list="events_perso_list" class="form-control flex-grow-1" id="events_perso"
                style="background-color: #202020;color: white;" placeholder="Roster">

            <datalist id="events_perso_list">
                ${html_options_perso}
            </datalist>

            <input list="events_cateogrie_list" class="form-control flex-grow-1" id="events_categorie"
                style="background-color: #202020;color: white;" placeholder="Roster">

            <datalist id="events_cateogrie_list">
                ${html_options_categorie}
            </datalist>

            <input id="events_description" class="form-control flex-grow-1"
                style="background-color: #202020;color: white;" placeholder="Description">

            <button id="add_events" type="button" class="btn btn-outline-light flex-shrink-1">Ajouter</button>
        </div>
    `);
}

$(document).on('click', '#add_events', function () {
    let perso = $('#events_perso').val();
    let categorie = $('#events_categorie').val();
    let description = $('#events_description').val();

    let event = {
        'perso': perso,
        'categorie': categorie,
        'description': description,
        'statut': 'todo',
        'date': new Date().toString()
    }

    db.get("events").push(event).save();
    
    events();
});

function objectifs() {
    let objectifs = (db.get("events").value()) ? db.get("events").value() : null;
    console.log(objectifs)

    if (objectifs.length > 0) {
        let html = '';

        objectifs.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date) || a.type.localeCompare(b.type) || b.perso - a.perso;
        });

        objectifs.forEach(function (objectif, i) {
            if(objectif.statut != 'done') html += `<div class="card-objectif pointer" data-id="${objectif.description}" style="flex: 1;display: flex;justify-content: center;flex-direction: column;"><span>${objectif.perso}</span><span>${objectif.categorie}</span><span>${objectif.description}</span></div>`;
        });

        $('#events_objectifs').html(html);
    } else {
        $('#events_objectifs').html('');
    }
}

function timeline() {
    let objectifs = (db.get("events").value()) ? db.get("events").value() : null;
    
    if (objectifs.length > 0) {
        let html = '';

        objectifs.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date) || a.type.localeCompare(b.type) || b.perso - a.perso;
        });

        objectifs.forEach(function (objectif, i) {
            if(objectif.statut == 'done') html += `<div class="histo-task" style="color: white;flex: 1;display: flex;justify-content: center;flex-direction: column;"><span>${objectif.perso}</span><span>${objectif.categorie}</span><span>${objectif.description}</span></div>`;
        });

        $('#timeline_objectifs').html(html);
    } else {
        $('#timeline_objectifs').html('');
    }
}

$(document).on('click', '.card-objectif', function () {
    let id = $(this).data('id');
    
    console.log(id);

    let index = db.get("events").value().findIndex((t) => t.description == id);
    let event = db.get("events").value().find((t) => t.description == id);

    if (event) {
        console.log(event)
        console.log(index)

        db.get("events")
            .get(index)
            .get('statut')
            .set('done');

        db.save();
    }

    events();
});
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------



// -------------------------------------------------------------------------------------------------------------
// --- PLANNING ------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
function planning() {
    $('.planning-wrapper').html('');

    // Programmed Raids
    $('.planning-wrapper').append(`<div class="card-content" style="grid-column: 1 / 4; grid-row: 1 / 11;"></div>`);

    // Calendar
    $('.planning-wrapper').append(`<div class="card-content d-flex align-items-center" style="grid-column: 4 / 17; grid-row: 1 / 11;"><div id="calendar_div" class="flex-grow-1"></div></div>`);

    // Events for calendar
    let events = (db.get("planning.events").value()) ? db.get("planning.events").value() : null;
    let calendarEvents = [];

    events.forEach(function (e, i) {
        calendarEvents.push({
            'id': e.id,
            'title': {html: `<p style="font-size: 20px;font-family: comfortaa;font-weight: 900;">${e.title}</p>`},
            'start': new Date(e.start),
            'end': new Date(e.end),
            'backgroundColor': e.backgroundColor,
            'textColor': e.textColor,
            'editable': false
        });
    });

    let ec = new EventCalendar(document.getElementById('calendar_div'), {
        view: 'timeGridWeek',
        allDaySlot: false,
        firstDay: 3,
        height: '100%',
        nowIndicator: true,
        slotMinTime: '11:00:00',
        slotMaxTime: '24:00:00',
        slotHeight: 48,
        events: calendarEvents
    });
}
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------



// -------------------------------------------------------------------------------------------------------------
// --- SETTINGS ------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
function settings() {
    $('.settings-wrapper').html('');

    $('.settings-wrapper').append(`
        <div id="btnExportJson" class="card-content" style="grid-column: 1 / 2; grid-row: 1 / 2;">
            <div class="settings-bouton pointer" style="display: flex;justify-content: center;align-items: center;height: 100%;">
                <span>Exporter les donn&eacute;es</span>
            </div>
        </div>
    `);

    $('.settings-wrapper').append(`
        <div class="card-content" style="grid-column: 2 / 3; grid-row: 1 / 2;">
            <div class="settings-bouton" style="display: flex;justify-content: center;align-items: center;height: 100%;flex-direction: column;">
                <span id="btnImportJson" class="pointer">Import&eacute;es les donn&eacute;es</span>
                <br>
                <input class="form-control" type="file" id="importFile">
            </div>
        </div>
    `);

    $('.settings-wrapper').append(`
        <div id="btnExportJson" class="card-content" style="grid-column: 1 / 2; grid-row: 2 / 3;">
            <div class="settings-bouton pointer" style="display: flex;justify-content: center;align-items: center;height: 100%;">
                <a href="../data.json" download style="text-decoration: none;">T&eacute;l&eacute;charger les donn&eacute;es originelles</a>
            </div>
        </div>
    `);

    $('.settings-wrapper').append(`
        <div id="btnExportJson" class="card-content" style="grid-column: 2 / 3; grid-row: 2 / 3;">
            <div class="settings-bouton pointer" style="display: flex;justify-content: center;align-items: center;height: 100%;">
                <span>R&eacute;initialiser les donn&eacute;es</span>
            </div>
        </div>
    `);
}

$(document).on('click', '#btnExportJson', function () {
    let dataStr = JSON.stringify(db.value());
    let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    let exportFileDefaultName = 'data.json';

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
});

$(document).on('click', '#btnImportJson', function (e) {
    let file = document.getElementById('importFile').files[0];

    if (file) {
        getAsText(file);
    }
});

function getAsText(readFile) {
    let reader = new FileReader();
    reader.readAsText(readFile, "UTF-8");
    reader.onload = loaded;
}

function loaded(evt) {
    let fileString = evt.target.result;
    fileJSON = JSON.parse(fileString);

    db.get("dashboard").set(fileJSON.dashboard);
    db.get("dashboard_card_stats").set(fileJSON.dashboard_card_stats);
    db.get("fate_embers").set(fileJSON.fate_embers);
    db.get("gold").set(fileJSON.gold);
    db.get("gold_histo").set(fileJSON.gold_histo);
    db.get("gold_income").set(fileJSON.gold_income);
    db.get("persos").set(fileJSON.persos);
    db.get("resetBiMensuel").set(fileJSON.resetBiMensuel);
    db.get("resetDaily").set(fileJSON.resetDaily);
    db.get("resetWeekly").set(fileJSON.resetWeekly);
    db.get("settings").set(fileJSON.settings);

    db.save()

    window.location.reload();
}
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------