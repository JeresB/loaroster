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
var scroll_position = [];

reset();

$(document).ready(function () {
    sidebar();
    dashboard();
});

function setScrollPos(div) {
    let scroll = scroll_position.find((s) => s.div == div);
    let index = scroll_position.findIndex((s) => s.div == div);

    if (scroll) scroll_position[index].scrollTop = document.getElementById(div).scrollTop;
    else scroll_position.push({ div: div, scrollTop: document.getElementById(div).scrollTop });
}

function getScrollPos(div) {
    let scroll = scroll_position.find((s) => s.div == div);

    if (scroll) return scroll.scrollTop;
    else return 0;
}

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
    if (page == 'daily') daily();
    if (page == 'weekly') weekly();
    if (page == 'settings') settings();
    if (page == 'gold') gold();
    if (page == 'fate-ember') fate_embers();
    if (page == 'gemme') gemme();
    if (page == 'events') events();
    if (page == 'planning') planning();
});

function sidebar() {
    sidebar_dashboard();
    sidebar_daily();
    sidebar_weekly();
    sidebar_golds();
    sidebar_fate_embers();
    sidebar_gemme();
    sidebar_events();
    sidebar_planning();
}
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------



// -------------------------------------------------------------------------------------------------------------
// --- DASHBOARD -----------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
function sidebar_dashboard() {
    $('#sidebar-dashboard-data').html('');
}

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

        let tbrel13 = db.get("dashboard").value().find((t) => t.tache_name == 'Brelshaza G1-3' && t.perso == task.perso);
        let tbrel4 = db.get("dashboard").value().find((t) => t.tache_name == 'Brelshaza G4' && t.perso == task.perso);
        
        if (task.tache_name != 'Kayangel' || (task.tache_name == 'Kayangel' && tbrel4.done > 0 && tbrel13.done == 0)) {
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
    }

    dashboard();
});

function dashboard() {
    sidebar_dashboard();
    sidebar_golds();

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
            if (index_perso < list_perso.length - 1) index_perso++;
        }

        list_perso[index_perso] ? showPerso(list_perso[index_perso], db.get("settings").value().dashboard.liste_types_taches_focus_on_carateres) : null;
    });

    // Mise en place de la card liste daily
    $('.dashboard-wrapper').append('<div class="card-content" style="grid-column: 7 / 9; grid-row: 2 / 8;"><div id="tasks-by-prio" onscroll="setScrollPos(\'tasks-by-prio\');" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>');

    // Mise en place de la card liste weekly
    $('.dashboard-wrapper').append('<div class="card-content" style="grid-column: 9 / 11; grid-row: 2 / 8;"><div id="tasks-weekly-by-prio" onscroll="setScrollPos(\'tasks-weekly-by-prio\');" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>');

    // Mise en place de la card liste raids
    $('.dashboard-wrapper').append('<div class="card-content" style="grid-column: 11 / 13; grid-row: 2 / 8;"><div id="tasks-raidlegion" onscroll="setScrollPos(\'tasks-raidlegion\');" class="scrollhidden"style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>');

    showTasksByPrio();
    showTasksWeeklyByPrio();
    showRaid();
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
        if (task.actif == true && tache_name.includes(task.tache_name) && task.rest >= task.restNeeded && ((task.type == 'event' && task.horaire.includes(moment().isoWeekday())) || task.type != 'event')) {
            total += task.done;
        }
    });

    return total;
}

function getTodo(tache_name) {
    let total = 0;

    db.get("dashboard").value().forEach(function (task, i) {
        if (task.actif == true && tache_name.includes(task.tache_name) && task.rest >= task.restNeeded && ((task.type == 'event' && task.horaire.includes(moment().isoWeekday())) || task.type != 'event')) {
            total += (task.repet - task.done);
        }
    });

    return total;
}

function getAll(tache_name) {
    let total = 0;

    db.get("dashboard").value().forEach(function (task, i) {
        if (task.actif == true && tache_name.includes(task.tache_name) && task.rest >= task.restNeeded && ((task.type == 'event' && task.horaire.includes(moment().isoWeekday())) || task.type != 'event')) {
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
                <style>
                    .table-task-${task.id} {
                        color: ${task.reset == 'daily' ? (task.type == 'GR' ? db.get("settings.colors.GR.text").value() : db.get("settings.colors.daily.text").value()) : db.get("settings.colors.weekly.text").value()};
                    }
                    .table-task-${task.id}:hover {
                        background-color: #444444;
                    }
                </style>
                <tr class="table-task table-task-${task.id}" data-id="${task.id}">
                    <td style="border-top-left-radius: 6px;border-bottom-left-radius: 6px;">${task.perso}</td>
                    <td>${task.tache_name}</td>
                    <td style="text-align: center;">${task.done}</td>
                    <td style="text-align: center;">${task.repet - task.done}</td>
                    <td style="text-align: center;">${task.rest > 0 ? task.rest : ''}</td>
                    <td style="text-align: center; border-top-right-radius: 6px;border-bottom-right-radius: 6px;">${task.duration}</td>
                </tr>
            `;

            task_remaining += (task.repet - task.done);
        });

        $('#div-perso').html(`
            <div class="head-task" style="flex: 1;display: flex;justify-content: center;flex-direction: row;background-color: #1e1e1e;text-align: center;position: sticky; top: 0;border-radius: 0px;min-height: 16%;max-height: 16%;gap: 20px;"><img src="${persos.logo}"><div style="display: flex; flex-direction: column; justify-content: center;">${persos.name} ${persos.ilevel}</span><span>Daily todo : ${task_remaining}</span></div></div>
            <table>
                <tr style="background-color: #444444;color: #a1a1a1;position: sticky;top: 92px;">
                    <th style="border-top-left-radius: 6px;border-bottom-left-radius: 6px;">Perso</th>
                    <th>Task</th>
                    <th style="text-align: center;">Done</th>
                    <th style="text-align: center;">Todo</th>
                    <th style="text-align: center;">Rest</th>
                    <th style="text-align: center; border-top-right-radius: 6px;border-bottom-right-radius: 6px;">Duration</th>
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
    let task_remaining = 0;

    config_raids.forEach(function (config_raid, i) {
        let tasks = (db.get("dashboard").value()) ? db.get("dashboard").value().filter((t) => t.actif == true && t.type == config_raid.name && t.done < t.repet) : null;
        let image = `<div class="image-task" style="border-radius: 10px;padding-bottom: 10px;position: sticky; top: 0;"><img style="width: 100%;border-radius: 10px;" src="${config_raid.image}" /></div>`;
        let text_color = db.get("settings.colors.text").value()
        let indeximage = true;

        tasks.forEach(function (task, i) {
            if (task.restriction !== undefined) {
                let taskrestriction = (db.get("dashboard").value()) ? db.get("dashboard").value().find((t) => t.id == task.restriction) : null;

                if (taskrestriction.done !== taskrestriction.repet) {
                    task_remaining++;
                    indeximage ? html += image : null;
                    html += `<div class="liste-task-no-card" style="flex: 1;display: flex;justify-content: center;flex-direction: column;" data-id="${task.id}"><span style="color: ${config_raid.color};font-size: 20px;">${task.repet - task.done} - ${task.perso}</span><span style="color: ${text_color};">${task.tache_name}</span>${task.description.length > 0 ? '<span style="color: ' + text_color + ';">' + task.description + '</span>' : ''}</div>`;
                    indeximage = false;
                }
            } else {
                task_remaining++;
                indeximage ? html += image : null;
                html += `<div class="liste-task-no-card" style="flex: 1;display: flex;justify-content: center;flex-direction: column;" data-id="${task.id}"><span style="color: ${config_raid.color};font-size: 20px;">${task.repet - task.done} - ${task.perso}</span><span style="color: ${text_color};">${task.tache_name}</span>${task.description.length > 0 ? '<span style="color: ' + text_color + ';">' + task.description + '</span>' : ''}</div>`;
                indeximage = false;
            }
        });
    });

    task_remaining > 0 ? $(`#sidebar-dashboard-data`).append(`<span style="color: #cf6363;"><i class="fa-solid fa-angles-up"></i>${task_remaining}</span>`) : $(`#sidebar-dashboard-data`).append(`<i class="fa-solid fa-check-double" style="color: #cf6363;"></i>`);

    $("#tasks-raidlegion").html(html);

    let div = document.getElementById('tasks-raidlegion');
    div.scrollTop = getScrollPos('tasks-raidlegion');
}

function showTasksByPrio() {
    let types = db.get("settings.dashboard.prio_task_daily").value();
    let tasks = (db.get("dashboard").value()) ? db.get("dashboard").value().filter((t) => t.actif == true && t.done < t.repet && (t.done == 0 && t.rest >= t.restNeeded || t.done > 0) && (types.includes(t.tache_name)) && ((t.type == 'event' && t.horaire.includes(moment().isoWeekday())) || t.type != 'event')) : null;

    let time_remaining = 0;
    let task_remaining = 0;
    let text_color = db.get("settings.colors.text").value();

    if (tasks.length > 0) {
        let html = '';
        let html_1 = '';
        let html_2 = '';
        let html_3 = '';
        let html_4 = '';
        
        tasks.sort(function (a, b) {
            return a.prio - b.prio;
        });

        tasks.forEach(function (task, i) {
            let importance = task.importance;
            html = `<div class="liste-task-no-card" style="flex: 1;display: flex;justify-content: center;flex-direction: column;" data-id="${task.id}"><span style="color: ${task.reset == 'daily' ? (task.type == 'GR' ? db.get("settings.colors.GR.text").value() : db.get("settings.colors.daily.text").value()) : db.get("settings.colors.weekly.text").value()};font-size: 20px;">${task.repet - task.done} - ${task.perso}</span><span style="color: ${text_color};">${task.tache_name} ${task.rest > 10 ? ` (${task.rest})` : ''}</span></div>`;

            if (task.rest >= 40 && importance > 1) importance--;
            
            if (importance == 1) html_1 += html;
            else if (importance == 2) html_2 += html;
            else if (importance == 3) html_3 += html;
            else if (importance == 4) html_4 += html;

            time_remaining += (task.duration * (task.repet - task.done));
            task_remaining += (task.repet - task.done);
        });

        html = `<div class="histo-task-dashboard" style="flex: 1;display: flex;justify-content: center;flex-direction: column;text-align: center;position: sticky; top: 0;min-height: 52px;max-height: 52px;"><span>Temps restants : ${time_remaining} min</span><span> Daily todo : ${task_remaining}</span></div>`;
        html += html_1.length > 0 ? `<div class="card-task-prio-dashboard prio_1 align-items-center" style="flex: 1;display: flex;justify-content: space-between;flex-direction: row;text-align: center;position: sticky; top: 0;min-height: 52px;max-height: 52px;"><i class="fa-solid fa-arrow-up-short-wide"></i> Must do all days</div>` + html_1 : '';
        html += html_2.length > 0 ? `<div class="card-task-prio-dashboard prio_2 align-items-center" style="flex: 1;display: flex;justify-content: space-between;flex-direction: row;text-align: center;position: sticky; top: 0;min-height: 52px;max-height: 52px;"><i class="fa-solid fa-arrow-up-short-wide"></i> Todo but not before sleep</div>` + html_2 : '';
        html += html_3.length > 0 ? `<div class="card-task-prio-dashboard prio_3 align-items-center" style="flex: 1;display: flex;justify-content: space-between;flex-direction: row;text-align: center;position: sticky; top: 0;min-height: 52px;max-height: 52px;"><i class="fa-solid fa-arrow-up-short-wide"></i> If I have some time</div>` + html_3 : '';
        html += html_4.length > 0 ? `<div class="card-task-prio-dashboard prio_4 align-items-center" style="flex: 1;display: flex;justify-content: space-between;flex-direction: row;text-align: center;position: sticky; top: 0;min-height: 52px;max-height: 52px;"><i class="fa-solid fa-arrow-up-short-wide"></i> Not mandatory</div>` + html_4 : '';

        $('#tasks-by-prio').html(html);
    } else {
        $('#tasks-by-prio').html('');
    }

    task_remaining > 0 ? $(`#sidebar-dashboard-data`).append(`<span style="color: #008b2b;"><i class="fa-solid fa-angles-up"></i>${task_remaining}</span>&nbsp;`) : $(`#sidebar-dashboard-data`).append(`<i class="fa-solid fa-check-double" style="color: #008b2b;"></i>&nbsp;`);

    let div = document.getElementById('tasks-by-prio');
    div.scrollTop = getScrollPos('tasks-by-prio');
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

        html = `<div class="histo-task-dashboard" style="flex: 1;display: flex;justify-content: center;flex-direction: column;text-align: center;position: sticky; top: 0;min-height: 52px;max-height: 52px;"><span>Temps restants : ${time_remaining} min</span><span> Weekly todo : ${task_remaining}</span></div>` + html;

        $('#tasks-weekly-by-prio').html(html);
    } else {
        $('#tasks-weekly-by-prio').html('');
    }

    task_remaining > 0 ? $(`#sidebar-dashboard-data`).append(`<span style="color: #2b87fb;"><i class="fa-solid fa-angles-up"></i>${task_remaining}</span>&nbsp;`) : $(`#sidebar-dashboard-data`).append(`<i class="fa-solid fa-check-double" style="color: #2b87fb;"></i>&nbsp;`);

    let div = document.getElementById('tasks-weekly-by-prio');
    div.scrollTop = getScrollPos('tasks-weekly-by-prio');
}
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------



// -------------------------------------------------------------------------------------------------------------
// --- DAILY ---------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
function sidebar_daily() {
    let tasks = db.get("dashboard").value().filter((t) => t.actif == true && t.reset == 'daily' && ((t.type == 'event' && t.horaire.includes(moment().isoWeekday())) || t.type != 'event'));
    let time_remaining = 0;

    tasks.forEach(function(t, i) {
        let todo = t.repet - t.done > 0 && t.rest >= t.restNeeded ? true : false;
        todo ? time_remaining += (t.duration * (t.repet - t.done)) : null;
    });

    let h_remaining = Math.floor(time_remaining / 60);
    let min_remaining = time_remaining % 60;

    h_remaining = h_remaining < 10 ? '0' + h_remaining : h_remaining;
    min_remaining = min_remaining < 10 ? '0' + min_remaining : min_remaining;

    $(`#sidebar-daily-data`).html(`<span style="color: #008b2b;">${h_remaining}:${min_remaining}</span>`);
}

function daily() {
    sidebar_daily();

    // Reset de l'HTML
    $('.daily-wrapper').html('');

    // Row 1
    $('.daily-wrapper').append('<div id="daily-entete-Jeresayaya" class="card-content" style="grid-column: 1 / 5; grid-row: 1 / 4;"></div>');
    $('.daily-wrapper').append('<div id="daily-entete-Jeresunshine" class="card-content" style="grid-column: 5 / 9; grid-row: 1 / 4;"></div>');
    $('.daily-wrapper').append('<div id="daily-entete-Jerescelestia" class="card-content" style="grid-column: 9 / 13; grid-row: 1 / 4;"></div>');
    $('.daily-wrapper').append('<div id="daily-entete-Jeresbard" class="card-content" style="grid-column: 13 / 17; grid-row: 1 / 4;"></div>');
    $('.daily-wrapper').append('<div id="daily-entete-Jeresakura" class="card-content" style="grid-column: 17 / 21; grid-row: 1 / 4;"></div>');
    
    $('.daily-wrapper').append('<div id="daily-tasks-Jeresayaya" class="card-daily-tasks scrollhidden flex-col-max-height" style="grid-column: 1 / 5; grid-row: 4 / 8;"></div>');
    $('.daily-wrapper').append('<div id="daily-tasks-Jeresunshine" class="card-daily-tasks scrollhidden flex-col-max-height" style="grid-column: 5 / 9; grid-row: 4 / 8;"></div>');
    $('.daily-wrapper').append('<div id="daily-tasks-Jerescelestia" class="card-daily-tasks scrollhidden flex-col-max-height" style="grid-column: 9 / 13; grid-row: 4 / 8;"></div>');
    $('.daily-wrapper').append('<div id="daily-tasks-Jeresbard" class="card-daily-tasks scrollhidden flex-col-max-height" style="grid-column: 13 / 17; grid-row: 4 / 8;"></div>');
    $('.daily-wrapper').append('<div id="daily-tasks-Jeresakura" class="card-daily-tasks scrollhidden flex-col-max-height" style="grid-column: 17 / 21; grid-row: 4 / 8;"></div>');
    
    // Row 2
    $('.daily-wrapper').append('<div id="daily-entete-Roster" class="card-content" style="grid-column: 1 / 5; grid-row: 8 / 11;"></div>');
    $('.daily-wrapper').append('<div id="daily-entete-Imanyrae" class="card-content" style="grid-column: 5 / 9; grid-row: 8 / 11;"></div>');
    $('.daily-wrapper').append('<div id="daily-entete-Shadow" class="card-content" style="grid-column: 9 / 13; grid-row: 8 / 11;"></div>');
    $('.daily-wrapper').append('<div id="daily-entete-Drevana" class="card-content" style="grid-column: 13 / 17; grid-row: 8 / 11;"></div>');
    $('.daily-wrapper').append('<div id="daily-entete-Jeresblade" class="card-content" style="grid-column: 17 / 21; grid-row: 8 / 11;"></div>');
    $('.daily-wrapper').append('<div id="daily-entete-Lopang" class="card-content" style="grid-column: 21 / 25; grid-row: 1 / 4;"></div>');
    
    $('.daily-wrapper').append('<div id="daily-tasks-Roster" class="card-daily-tasks scrollhidden flex-col-max-height" style="grid-column: 1 / 5; grid-row: 11 / 15;"></div>');
    $('.daily-wrapper').append('<div id="daily-tasks-Imanyrae" class="card-daily-tasks scrollhidden flex-col-max-height" style="grid-column: 5 / 9; grid-row: 11 / 15;"></div>');
    $('.daily-wrapper').append('<div id="daily-tasks-Shadow" class="card-daily-tasks scrollhidden flex-col-max-height" style="grid-column: 9 / 13; grid-row: 11 / 15;"></div>');
    $('.daily-wrapper').append('<div id="daily-tasks-Drevana" class="card-daily-tasks scrollhidden flex-col-max-height" style="grid-column: 13 / 17; grid-row: 11 / 15;"></div>');
    $('.daily-wrapper').append('<div id="daily-tasks-Jeresblade" class="card-daily-tasks scrollhidden flex-col-max-height" style="grid-column: 17 / 21; grid-row: 11 / 15;"></div>');
    $('.daily-wrapper').append('<div id="daily-tasks-Lopang" class="card-daily-tasks scrollhidden flex-col-max-height" style="grid-column: 21 / 25; grid-row: 4 / 15;"></div>');

    tasksDaily();
}

function tasksDaily() {
    let tasks = db.get("dashboard").value().filter((t) => t.actif == true && t.reset == 'daily' && ((t.type == 'event' && t.horaire.includes(moment().isoWeekday())) || t.type != 'event'));
    // let gr_tasks = ['Gargadis', 'Sonavel', 'Hanumatan'];
    let bgcolor = '';
    let color = '';

    tasks.forEach(function(t, i) {
        let perso = list_perso.find((p) => p.perso.includes(t.perso));
        let importance = t.importance;
        let tache_name = perso.name == 'Lopang' ? t.tache_name + '<br>' + t.perso : t.tache_name;
        let todo = t.repet - t.done > 0 && t.rest >= t.restNeeded ? true : false;

        if (t.rest >= 40 && importance > 1) importance--;
            
        if (importance == 1) {
            bgcolor = '#511313';
            color = '#a1a1a1';
        } else if (importance == 2) {
            bgcolor = '#54391e';
            color = '#a1a1a1';
        } else if (importance == 3) {
            bgcolor = '#4f4416';
            color = '#a1a1a1';
        } else if (importance == 4) {
            bgcolor = '#36515a';
            color = '#a1a1a1';
        }

        $(`#daily-entete-${perso.name}`).css('background-image', `url(${perso.image})`);
        $(`#daily-entete-${perso.name}`).css('background-repeat', 'no-repeat');
        $(`#daily-entete-${perso.name}`).css('background-position', 'center center');
        $(`#daily-entete-${perso.name}`).css('background-size', 'cover');

        $(`#daily-tasks-${perso.name}`).append(`<div class="${todo ? 'card-daily-todo' : 'card-daily-done'}" style="flex: 1;display: flex;justify-content: center;flex-direction: row;justify-content: space-between;align-items: center;${todo ? `background-color: ${bgcolor};color: ${color};` : ''}" data-id="${t.id}"><span style="font-size: 20px;">${tache_name} ${t.rest > 10 ? ` (${t.rest})` : ''}</span><span style="font-size: 20px;">${t.done} / ${t.repet}</span></div>`);

    });
}

$(document).on('click', '.card-daily-todo', function () {
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
    }

    daily();
});
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------



// -------------------------------------------------------------------------------------------------------------
// --- WEEKLY --------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
function sidebar_weekly() {
    let type = [ 'Ebony Cube', 'Pirate Shop', 'Guilde Shop', 'Elgacia Shop', 'GVE', 'Event Shop', 'Legion Raid Shop', 'Elgacia leg Shop', 'Abyssal Challenge', 'GR Challenge' ];
    let tasks = db.get("dashboard").value().filter((t) => t.actif == true && t.reset == 'weekly' && type.includes(t.tache_name));
    let time_remaining = 0;

    tasks.forEach(function(t, i) {
        let todo = t.repet - t.done > 0  ? true : false;
        todo ? time_remaining += (t.duration * (t.repet - t.done)) : null;
    });

    let h_remaining = Math.floor(time_remaining / 60);
    let min_remaining = time_remaining % 60;

    h_remaining = h_remaining < 10 ? '0' + h_remaining : h_remaining;
    min_remaining = min_remaining < 10 ? '0' + min_remaining : min_remaining;

    $(`#sidebar-weekly-data`).html(`<span style="color: #2b87fb;">${h_remaining}:${min_remaining}</span>`);
}

function weekly() {
    sidebar_weekly();

    // Reset de l'HTML
    $('.weekly-wrapper').html('');

    // Row 1
    $('.weekly-wrapper').append('<div id="weekly-entete-Roster" class="card-content" style="grid-column: 1 / 5; grid-row: 1 / 4;"></div>');
    $('.weekly-wrapper').append('<div id="weekly-entete-Jeresayaya" class="card-content" style="grid-column: 5 / 9; grid-row: 1 / 4;"></div>');
    $('.weekly-wrapper').append('<div id="weekly-entete-Jeresunshine" class="card-content" style="grid-column: 9 / 13; grid-row: 1 / 4;"></div>');
    $('.weekly-wrapper').append('<div id="weekly-entete-Jerescelestia" class="card-content" style="grid-column: 13 / 17; grid-row: 1 / 4;"></div>');
    
    $('.weekly-wrapper').append('<div id="weekly-tasks-Roster" class="card-weekly-tasks scrollhidden flex-col-max-height" style="grid-column: 1 / 5; grid-row: 4 / 15;"></div>');
    $('.weekly-wrapper').append('<div id="weekly-tasks-Jeresayaya" class="card-weekly-tasks scrollhidden flex-col-max-height" style="grid-column: 5 / 9; grid-row: 4 / 8;"></div>');
    $('.weekly-wrapper').append('<div id="weekly-tasks-Jeresunshine" class="card-weekly-tasks scrollhidden flex-col-max-height" style="grid-column: 9 / 13; grid-row: 4 / 8;"></div>');
    $('.weekly-wrapper').append('<div id="weekly-tasks-Jerescelestia" class="card-weekly-tasks scrollhidden flex-col-max-height" style="grid-column: 13 / 17; grid-row: 4 / 8;"></div>');
    
    // Row 2
    $('.weekly-wrapper').append('<div id="weekly-entete-Jeresbard" class="card-content" style="grid-column: 5 / 9; grid-row: 8 / 11;"></div>');
    $('.weekly-wrapper').append('<div id="weekly-entete-Jeresakura" class="card-content" style="grid-column: 9 / 13; grid-row: 8 / 11;"></div>');
    $('.weekly-wrapper').append('<div id="weekly-entete-Imanyrae" class="card-content" style="grid-column: 13 / 17; grid-row: 8 / 11;"></div>');
    $('.weekly-wrapper').append('<div id="weekly-entete-horsroster" class="card-content" style="grid-column: 17 / 21; grid-row: 1 / 4;"></div>');
    
    $('.weekly-wrapper').append('<div id="weekly-tasks-Jeresbard" class="card-weekly-tasks scrollhidden flex-col-max-height" style="grid-column: 5 / 9; grid-row: 11 / 15;"></div>');
    $('.weekly-wrapper').append('<div id="weekly-tasks-Jeresakura" class="card-weekly-tasks scrollhidden flex-col-max-height" style="grid-column: 9 / 13; grid-row: 11 / 15;"></div>');
    $('.weekly-wrapper').append('<div id="weekly-tasks-Imanyrae" class="card-weekly-tasks scrollhidden flex-col-max-height" style="grid-column: 13 / 17; grid-row: 11 / 15;"></div>');
    $('.weekly-wrapper').append('<div id="weekly-tasks-horsroster" class="card-weekly-tasks scrollhidden flex-col-max-height" style="grid-column: 17 / 21; grid-row: 4 / 15;"></div>');

    tasksWeekly();
}

function tasksWeekly() {
    let type = [ 'Ebony Cube', 'Pirate Shop', 'Guilde Shop', 'Elgacia Shop', 'GVE', 'Event Shop', 'Legion Raid Shop', 'Elgacia leg Shop', 'Abyssal Challenge', 'GR Challenge' ];
    let tasks = db.get("dashboard").value().filter((t) => t.actif == true && t.reset == 'weekly' && type.includes(t.tache_name));

    let bgcolor = '#08428C';
    let color = '#98BFF0';

    tasks.forEach(function(t, i) {
        let perso = list_perso.find((p) => p.perso.includes(t.perso));
        let persohorsroster = [ 'Shadow', 'Drevana', 'Jeresblade', 'Lopang' ];
        let tache_name = persohorsroster.includes(perso.name) ? t.tache_name + '<br>' + t.perso : t.tache_name;
        let todo = t.repet - t.done > 0 ? true : false;
        let personame = persohorsroster.includes(perso.name) ? 'horsroster' : perso.name;

        $(`#weekly-entete-${personame}`).css('background-image', `url(${perso.image})`);
        $(`#weekly-entete-${personame}`).css('background-repeat', 'no-repeat');
        $(`#weekly-entete-${personame}`).css('background-position', 'center center');
        $(`#weekly-entete-${personame}`).css('background-size', 'cover');

        $(`#weekly-tasks-${personame}`).append(`<div class="${todo ? 'card-weekly-todo' : 'card-weekly-done'}" style="flex: 1;display: flex;justify-content: center;flex-direction: row;justify-content: space-between;align-items: center;${todo ? `background-color: ${bgcolor};color: ${color};` : ''}" data-id="${t.id}"><span style="font-size: 20px;">${tache_name} ${t.rest > 10 ? ` (${t.rest})` : ''}</span><span style="font-size: 20px;">${t.done} / ${t.repet}</span></div>`);
    });
}

$(document).on('click', '.card-weekly-todo', function () {
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
    }

    weekly();
});
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------



// -------------------------------------------------------------------------------------------------------------
// --- GOLD ----------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
var goldchart = null;

function sidebar_golds() {
    let last_reset = moment(db.get("resetWeekly").value(), 'DD-MM-YYYY').toDate();
    let gold_histo_last_reset = db.get("gold_histo").value().find(function (h) { return new Date(h.date) >= last_reset });

    if (!gold_histo_last_reset) {
        gold_histo_last_reset = db.get("gold_histo").value().findLast((g) => true);
    }

    $('#sidebar-golds-datavalue').html(`${new Intl.NumberFormat('fr-FR').format(db.get("gold").value())} Golds`);
    $('#sidebar-golds-datastatus').html(`${gold_histo_last_reset.gold > db.get("gold").value() ? `<span style="color: #cf6363;font-size: 24px;"><i class="fa-solid fa-arrow-trend-down"></i>` : `<span style="color: #00b135;font-size: 24px;"><i class="fa-solid fa-arrow-trend-up"></i>`}&nbsp;${(((db.get("gold").value() * 100) / gold_histo_last_reset.gold) - 100).toFixed(2)}%</span>`);
}

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

    sidebar_golds();
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

$(document).on('keyup', '#gold_histo_search', function () {
    let search = $(this).val();
    
    if (search.length >= 3) {
        $("#historique_gold_income .goldhisto").hide();
        $(`#historique_gold_income .goldhisto span:contains('${search}')`).parent().show();
    }

    if (search.length == 0) {
        $("#historique_gold_income .goldhisto").show();
    }
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

            html += `<div class="histo-task goldhisto" style="color: white;flex: 1;display: flex;justify-content: center;flex-direction: column;"><span style="color: #${bg_color};font-size: x-large;">${gold_income.montant > 0 ? '+' : ''}${new Intl.NumberFormat('fr-FR').format(gold_income.montant)} Golds</span><span>${gold_income.type}</span>${gold_income.description ? `<span>${gold_income.description}</span>` : ''}<span style="color: #a1a1a1;">${gold_income.perso}</span><span style="color: #a1a1a1;">le ${new Date(gold_income.date).toLocaleDateString()}</span></div>`;
        });

        $('#historique_gold_income').html(`
            <div style="flex: 1;display: flex;justify-content: center;flex-direction: column;background-color: #1e1e1e;text-align: center;position: sticky; top: 0;border-radius: 0px;">
                <input class="form-control" id="gold_histo_search" style="background-color: #202020;color: white;" placeholder="Search">
            </div>
            ${html}
        `);
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

    if (!gold_histo_last_reset) {
        gold_histo_last_reset = db.get("gold_histo").value().findLast((g) => true);
    }

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

    Object.entries(gold_incomes_groupby_persos).forEach(function (gold_income_group, i) {
        let total = 0;

        gold_income_group[1].forEach(function (g, i) {
            total += g.montant;
        });

        gold_incomes_group_total.push({ "perso": gold_income_group[0], "montant": total });
    });

    gold_incomes_group_total.forEach(function (g, i) {
        let perso = list_perso.find((p) => p.name == g.perso);

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

function sidebar_fate_embers() {   
    let last_reset = moment(db.get("resetWeekly").value(), 'DD-MM-YYYY').toDate();
    
    let total = db.get("fate_embers").value().length;
    let week = db.get("fate_embers").value().filter((fe) => new Date(fe.date) >= last_reset).length;

    $('#sidebar-fate-embers-datatotal').html(`${total} Fate Embers`);
    $('#sidebar-fate-embers-dataweek').html(`<span style="color: #008b2b;"><i class="fa-solid fa-arrow-trend-up"></i>&nbsp;${week}</span>`);
}

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

    sidebar_fate_embers();
    sidebar_golds();
    fateEmbersHistorique();
    fateEmbersCharts();
    fateEmbersForm();
    fateEmbersStats();
}

function fateEmbersHistorique() {
    let fate_embers = (db.get("fate_embers").value()) ? db.get("fate_embers").value() : null;

    let silver = [];
    let gold = [];
    let xpcardpack = [];
    let honingchest = [];
    let cardpack = [];

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

            html += `<div class="histo-task" style="flex: 1;display: flex;justify-content: center;flex-direction: column;"><span style="color: #${bg_color};font-size: 20px;">${fate_ember.type}</span><span style="color: #a1a1a1;">${fate_ember.perso}</span><span style="color: #a1a1a1;">Le ${new Date(fate_ember.date).toLocaleDateString()}</span></div>`;
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
                        nbfateember('500K Silver'), 0, 0, 0, 0
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
                        nbfateember('1M Silver'), 0, 0, 0, 0
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
                        nbfateember('2M Silver'), 0, 0, 0, 0
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
                        0, nbfateember('1500 Golds'), 0, 0, 0
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
                        0, nbfateember('3K Golds'), 0, 0, 0
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
                        0, nbfateember('10K Golds'), 0, 0, 0
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
                        0, nbfateember('20K Golds'), 0, 0, 0
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
                        0, nbfateember('50K Golds'), 0, 0, 0
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
                        0, nbfateember('100K Golds'), 0, 0, 0
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
                        0, 0, nbfateember('Normal Xp Card Pack'), 0, 0
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
                        0, 0, nbfateember('Lucky Xp Card Pack'), 0, 0
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
                        0, 0, nbfateember('Special Xp Card Pack'), 0, 0
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
                        0, 0, nbfateember('Premium Xp Card Pack'), 0, 0
                    ],
                    backgroundColor: 'rgba(246, 178, 107, 0.8)',
                    borderColor: 'rgb(246, 178, 107)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: 'S Honing Chest',
                    data: [
                        0, 0, 0, nbfateember('S Honing Chest'), 0
                    ],
                    backgroundColor: 'rgba(164, 194, 244, 0.5)',
                    borderColor: 'rgb(164, 194, 244)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: 'M Honing Chest',
                    data: [
                        0, 0, 0, nbfateember('M Honing Chest'), 0
                    ],
                    backgroundColor: 'rgba(164, 194, 244, 0.6)',
                    borderColor: 'rgb(164, 194, 244)',
                    borderWidth: 0,
                    borderRadius: 6,
                    //borderSkipped: false,
                },
                {
                    label: 'L Honing Chest',
                    data: [
                        0, 0, 0, nbfateember('L Honing Chest'), 0
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
                        0, 0, 0, 0, nbfateember('Epic Card Pack')
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
                        0, 0, 0, 0, nbfateember('Random Legendary Card Pack')
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
                        0, 0, 0, 0, nbfateember('Selection Legendary Card Pack')
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
                    ((nbfateember('500K Silver') * 0.5) + nbfateember('1M Silver') + (nbfateember('2M Silver') * 2)),
                    ((nbfateember('1500 Golds') * 0.15) + (nbfateember('3K Golds') * 0.3) + nbfateember('10K Golds') + (nbfateember('20K Golds') * 2) + (nbfateember('50K Golds') * 5) + (nbfateember('100K Golds') * 10)),
                    (nbfateember('Normal Xp Card Pack') + (nbfateember('Lucky Xp Card Pack') * 2) + (nbfateember('Special Xp Card Pack') * 3) + (nbfateember('Premium Xp Card Pack') * 5)),
                    ((nbfateember('S Honing Chest') * 0.5) + (nbfateember('M Honing Chest') * 1) + (nbfateember('L Honing Chest') * 2)),
                    nbfateember('Epic Card Pack') + nbfateember('Random Legendary Card Pack') + nbfateember('Selection Legendary Card Pack')
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

        c.liste_type.forEach(function (t, i) {
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
// --- GEMME ---------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
function sidebar_gemme() {
    let total = db.get('gemmes.total').value();
    let week = db.get('gemmes.week').value();

    $('#sidebar-gemme-datavalue').html(total);
    $('#sidebar-gemme-datastatus').html(`<span style="color: #008b2b;"><i class="fa-solid fa-arrow-trend-up"></i>&nbsp;${week}</span>`);
}

function gemme() {
    $('.gemme-wrapper').html('');

    // Header - Nombre de gemme généré cette semaine 
    // -> exemple avec 8 gemmes 5 générées -> afficher 2 gemmes 6 et 2 gemmes 5
    // -> exemple avec 11 gemmes 5 générées -> afficher 1 gemme 7 et 2 gemme 5 
    $('.gemme-wrapper').append(`<div id="gemme_value" class="card-content" style="grid-column: 1 / 13; grid-row: 1 / 2;"></div>`);

    // Liste des persos qui gagne des gemmes
    $('.gemme-wrapper').append(`<div id="liste_persos_gemmes" class="d-flex flex-row" style="grid-column: 1 / 13; grid-row: 2 / 3; gap: 10px;"></div>`);

    // 3 ou 4 Cards stats -> avec le logo de la gemme (dmg et / ou cdr)
    // Nb gemmes 5 total
    // Nb gemmes 7 total
    // Nb gemmes 9 total
    // Nb gemmes 10 total (optional to see if it's good)
    $('.gemme-wrapper').append(`<div class="gemmes_stats gemmes_stats_5 gemmes_stats_6 card-content d-flex flex-row justify-content-between align-items-center" style="grid-column: 5 / 7; grid-row: 3 / 4;"></div>`);
    $('.gemme-wrapper').append(`<div class="gemmes_stats gemmes_stats_7 gemmes_stats_8 card-content d-flex flex-row justify-content-between align-items-center" style="grid-column: 7 / 9; grid-row: 3 / 4;"></div>`);
    $('.gemme-wrapper').append(`<div class="gemmes_stats gemmes_stats_9 card-content d-flex flex-row justify-content-between align-items-center" style="grid-column: 9 / 11; grid-row: 3 / 4;"></div>`);
    $('.gemme-wrapper').append(`<div class="gemmes_stats gemmes_stats_10 card-content d-flex flex-row justify-content-between align-items-center" style="grid-column: 11 / 13; grid-row: 3 / 4;"></div>`);


    // Sur la partie gauche en hauteur
    // Une liste des objectifs futur en termes de gemmes dans l'ordre des priorités
    // Un formulaire pour remplir cette liste ?
    // Click sur un objectif pour le compléter
    $('.gemme-wrapper').append(`<div class="card-content" style="grid-column: 1 / 5; grid-row: 3 / 10;"></div>`);
    $('.gemme-wrapper').append(`<div class="card-content" style="grid-column: 1 / 5; grid-row: 10 / 16;"></div>`);


    // sur le contenu principale -> x grandes cards avec l'espace disponible
    // Le nom du ou des persos
    // Un bouton pour ajouter une gemme 5 généré sur le perso // Différencier dmg / cdr ?
    // Affichage dynamique en flex des gemmes avec possibilité de surligner la gemme si elle fait partie des objectifs
    $('.gemme-wrapper').append(`<div class="card-content" style="grid-column: 5 / 9; grid-row: 4 / 10;"><div id="gemme_class_1" style="flex: 1;height: 100%!important;"></div></div>`);
    $('.gemme-wrapper').append(`<div class="card-content" style="grid-column: 5 / 9; grid-row: 10 / 16;"><div id="gemme_class_3" style="flex: 1;height: 100%!important;"></div></div>`);
    $('.gemme-wrapper').append(`<div class="card-content" style="grid-column: 9 / 13; grid-row: 4 / 10;"><div id="gemme_class_2" style="flex: 1;height: 100%!important;"></div></div>`);
    $('.gemme-wrapper').append(`<div class="card-content" style="grid-column: 9 / 13; grid-row: 10 / 16;"><div id="gemme_class_4" style="flex: 1;height: 100%!important;"></div></div>`);


    sidebar_gemme();

    gemmesClasses();
    gemmeValue();
    gemmesPersos();
}

function gemmeValue() {
    let total = db.get('gemmes.total').value();
    let week = db.get('gemmes.week').value();
    let total_save = total;
    let gemme_level = 5;
    let html = '';
    let random = 1;

    $('.gemmes_stats').html('');

    for (let index = 0; index < 6; index++) {
        
        let nb = Math.floor(week % 3);
        
        for (let index = 0; index < nb; index++) {
            random = Math.random() > 0.5 ? 1 : 2;
            html += `<span class="d-flex flex-column gap-2 text-center"><img src="images/gem${gemme_level}_${random}.webp" style="background-image: url('images/gem${gemme_level}_bg.webp');background-size: cover;border-radius: 8px;" /><span style="font-size: 16px;">Niv.${gemme_level}</span></span>`;
        }
        // html += `<img src="images/gem${gemme_level}_${random}.webp" />`;
        // html += `<span>Gem ${gemme_level} : {${Math.floor(total % 3)}}</span>`;
        gemme_level++;
        week = week / 3;
    }

    $(`.gemmes_stats_5`).append(`<span><img src="images/gem5_${Math.random() > 0.5 ? 1 : 2}.webp" style="background-image: url('images/gem5_bg.webp');background-size: cover;border-radius: 8px;" /></span><span style="font-size: 32px;">${total_save}</span>`);
    $(`.gemmes_stats_7`).append(`<span><img src="images/gem7_${Math.random() > 0.5 ? 1 : 2}.webp" style="background-image: url('images/gem7_bg.webp');background-size: cover;border-radius: 8px;" /></span><span style="font-size: 32px;">${Math.floor(total_save / 9)}</span>`);
    $(`.gemmes_stats_9`).append(`<span><img src="images/gem9_${Math.random() > 0.5 ? 1 : 2}.webp" style="background-image: url('images/gem9_bg.webp');background-size: cover;border-radius: 8px;" /></span><span style="font-size: 32px;">${Math.floor(total_save / 81)}</span>`);
    $(`.gemmes_stats_10`).append(`<span><img src="images/gem10_${Math.random() > 0.5 ? 1 : 2}.webp" style="background-image: url('images/gem10_bg.webp');background-size: cover;border-radius: 8px;" /></span><span style="font-size: 32px;">${Math.floor(total_save / 243)}</span>`);

    $('#gemme_value').html(`
        <div class="" style="display: flex;justify-content: center;align-items: center;height: 100%;font-size: 32px;gap: 30px;">
            ${html}  
        </div>
    `);
}

function gemmesPersos() {
    $('#liste_persos_gemmes').html('');

    let collected = db.get("gemmes.collected").value();

    collected.forEach(function (c, i) {
        $('#liste_persos_gemmes').append(`<div class="card-gemme-perso-collected" data-id="${i}" style="flex: 1;display: flex;justify-content: center;flex-direction: column;text-align: center;"><span style="font-size: 20px;">${c.gemme}/${c.name}</span></div>`);
    });
}

$(document).on('click', '.card-gemme-perso-collected', function () {
    let gem = db.get("gemmes.collected")
        .get($(this).data('id'))
        .get('gemme').value();
    
    db.get("gemmes.collected")
        .get($(this).data('id'))
        .get('gemme')
        .set(parseInt(gem) + 1);

    db.get("gemmes.week").set(parseInt(db.get("gemmes.week").value()) + 1);

    db.get("gemmes.total").set(parseInt(db.get("gemmes.total").value()) + 1);

    db.save();

    gemme();
});

function gemmesClasses() {
    let classes = db.get('gemmes.classes').value();
    let disposition = [ {x: 0, y:0}, {x: 1, y:0}, {x: 3, y:0}, {x: 4, y:0}, {x: 1, y:1}, {x: 2, y:1}, {x: 3, y:1}, {x: 0, y:2}, {x: 1, y:2}, {x: 3, y:2}, {x: 4, y:2} ];

    classes.forEach(function (c, i) {
        let html = '';

        // console.log(c)

        // c.persos.forEach(function (p, j) {
            // html_persos += `<div class="card-gemme-perso" data-idclasse="${i}" data-idperso="${j}" style="flex: 1;display: flex;justify-content: center;flex-direction: column;text-align: center;"><span style="font-size: 20px;">${p.gemme}/${p.name}</span></div>`;
        // });
        
        html += `<div class="" style="flex: 1;display: flex;justify-content: center;flex-direction: column;text-align: center;"><span style="font-size: 20px;">${c.name}</span></div>`;

        $(`#${c.div}`).html(`
            <div class="d-flex gap-2 justify-content-center flex-row">${html}</div>
        `);
    });
}

$(document).on('click', '.card-gemme-perso', function () {
    let gem = db.get("gemmes.classes")
        .get($(this).data('idclasse'))
        .get('persos')
        .get($(this).data('idperso'))
        .get('gemme').value();
    
    db.get("gemmes.classes")
        .get($(this).data('idclasse'))
        .get('persos')
        .get($(this).data('idperso'))
        .get('gemme')
        .set(parseInt(gem) + 1);

    db.get("gemmes.week").set(parseInt(db.get("gemmes.week").value()) + 1);

    db.get("gemmes.total").set(parseInt(db.get("gemmes.total").value()) + 1);

    db.save();

    gemme();
});
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------



// -------------------------------------------------------------------------------------------------------------
// --- EVENTS --------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
function sidebar_events() {
    let objectifs = (db.get("events").value()) ? db.get("events").value() : null;
    let doing = 0;
    let done = 0;

    if (objectifs.length > 0) {
        objectifs.forEach(function (objectif, i) {
            if (objectif.statut != 'done') doing++;
            else done++;
        });
    }

    $('#sidebar-events-data').html(`<span style="color: #008b2b;"><i class="fa-solid fa-plane-departure"></i> ${doing}</span>`);
}

function events() {
    $('.events-wrapper').html('');

    // Timeline
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 4 / 7; grid-row: 1 / 11;"><div id="timeline_objectifs" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);

    // Formulaire
    $('.events-wrapper').append(`<div id="events_form" class="card-content" style="grid-column: 7 / 17; grid-row: 1 / 2;"></div>`);

    // Objectifs
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 1 / 4; grid-row: 1 / 11;"><div id="events_objectifs" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);

    // Persos
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 7 / 12; grid-row: 2 / 5;"><div id="perso1-wrapper" class="perso-wrapper"></div></div>`);
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 7 / 12; grid-row: 5 / 8;"><div id="perso2-wrapper" class="perso-wrapper"></div></div>`);
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 7 / 12; grid-row: 8 / 11;"><div id="perso3-wrapper" class="perso-wrapper"></div></div>`);
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 12 / 17; grid-row: 2 / 5;"><div id="perso4-wrapper" class="perso-wrapper"></div></div>`);
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 12 / 17; grid-row: 5 / 8;"><div id="perso5-wrapper" class="perso-wrapper"></div></div>`);
    $('.events-wrapper').append(`<div class="card-content" style="grid-column: 12 / 17; grid-row: 8 / 11;"><div id="perso6-wrapper" class="perso-wrapper"></div></div>`);

    $('#image-perso').bind('mousewheel', function (e) {
        if (e.originalEvent.wheelDelta / 120 > 0) {
            if (index_perso > 0) index_perso--;
        }
        else {
            if (index_perso < list_perso.length - 1) index_perso++;
        }

        list_perso[index_perso] ? showPerso(list_perso[index_perso], db.get("settings").value().dashboard.liste_types_taches_focus_on_carateres) : null;
    });
    
    sidebar_events();
    eventsFormulaire();
    objectifs();
    timeline();
    eventsPerso('Jeresayaya', 'perso1');
    eventsPerso('Jeresunshine', 'perso4');
    eventsPerso('Jeresbard', 'perso2');
    eventsPerso('Jerescelestia', 'perso3');
    eventsPerso('Jeresakura', 'perso5');
    eventsPerso('Imanyrae', 'perso6');
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
                style="background-color: #202020;color: white;" placeholder="Roster / Caract&egrave;res">

            <datalist id="events_perso_list">
                ${html_options_perso}
            </datalist>

            <input list="events_cateogrie_list" class="form-control flex-grow-1" id="events_categorie"
                style="background-color: #202020;color: white;" placeholder="Cat&eacute;gorie : Honing, Elixir, Gear, ...">

            <datalist id="events_cateogrie_list">
                ${html_options_categorie}
            </datalist>

            <input id="events_description" class="form-control flex-grow-1"
                style="background-color: #202020;color: white;" placeholder="Description">

            <input id="events_max" type="number" class="form-control flex-grow-1"
                style="background-color: #202020;color: white;" placeholder="Nombre d'&eacute;tapes">

            <input id="events_prio" type="number" class="form-control"
                style="background-color: #202020;color: white;" placeholder="Priorit&eacute;">
            
            <div class="form-check" style="margin-bottom: 0px;">
                <input id="events_expensive" title="Expensive ?" class="form-check-input" type="checkbox" style="width: 2.2em;height: 100%;margin-top: 0em;">
            </div>

            <button id="add_events" type="button" class="btn btn-outline-light flex-shrink-1">Ajouter</button>
        </div>
    `);
}

$(document).on('click', '#add_events', function () {
    let perso = $('#events_perso').val();
    let categorie = $('#events_categorie').val();
    let description = $('#events_description').val();
    let max = $('#events_max').val();
    let prio = $('#events_prio').val();
    let expensive = $('#events_expensive').is(":checked");

    let event = {
        'perso': perso,
        'categorie': categorie,
        'description': description,
        'statut': 'todo',
        'compteur': 0,
        'max': parseInt(max),
        'priority': parseInt(prio),
        'expensive': expensive,
        'date': new Date().toString()
    }

    db.get("events").push(event).save();

    events();
});

function objectifs() {
    let objectifs = (db.get("events").value()) ? db.get("events").value() : null;
    let categorie = null;
    let top_priority = 1;
    // console.log(objectifs)

    if (objectifs.length > 0) {
        let html = '';
        let gold_saved = true;

        let last_reset = moment(db.get("resetWeekly").value(), 'DD-MM-YYYY').toDate();
        let gold_histo_last_reset = db.get("gold_histo").value().find(function (h) { return new Date(h.date) >= last_reset });

        if (!gold_histo_last_reset) gold_histo_last_reset = db.get("gold_histo").value().findLast((g) => true);
        if (gold_histo_last_reset.gold > db.get("gold").value()) gold_saved = false;

        objectifs.sort(function (a, b) {
            return b.priority - a.priority || a.categorie.localeCompare(b.categorie) || a.perso.localeCompare(b.perso);
        });

        objectifs.forEach(function (o, i) {
            if (o.priority > top_priority && o.expensive) top_priority = o.priority;
        });

        objectifs.forEach(function (objectif, i) {
            if (objectif.statut != 'done') {
                let can_be_done = objectif.expensive && gold_saved || !objectif.expensive || objectif.priority == top_priority;

                if (!categorie || categorie != objectif.categorie) {
                    categorie = objectif.categorie;
                    html += `<div class="card-timeline" style="display: flex;justify-content: center;flex-direction: column;background-color: #444444;text-align: center;position: sticky; top: 0;font-size: 24px;"><span><i class="fa-solid fa-list"></i> ${categorie}</span></div>`;
                }

                html += `<div class="card-timeline objectif_todo ${can_be_done ? 'pointer' : ''}" ${can_be_done ? `data-id="${objectif.description}"` : ''} style="display: flex;justify-content: center;flex-direction: column;background-color: ${can_be_done ? '#014b89' : '#652222'};">
                            <span style="color: white;"><span style="float: right;"><i class="fa-solid fa-arrow-up" data-prio="up" data-id="${objectif.description}" style="background-color: #a1a1a1;padding: 2px;color: black;border-radius: 4px;"></i> <i class="fa-solid fa-arrow-down" data-prio="down" data-id="${objectif.description}" style="background-color: #a1a1a1;padding: 2px;color: black;border-radius: 4px;"></i></span>${objectif.description}</span>
                            <span>${objectif.perso} - ${objectif.categorie}</span>
                            <span style="white-space: nowrap; overflow-x: hidden;">Priorit&eacute; ${objectif.priority}</span>
                            <span style="white-space: nowrap; overflow-x: hidden;">${objectif.max > 0 ? `${objectif.compteur} / ${objectif.max}` : `Compteur <i class="fa-solid fa-arrow-right"></i> ${objectif.compteur}`}</span>
                            ${objectif.max > 0 ? `
                                <div class="progress" style="margin-bottom: 6px;">
                                    <div class="progress-bar bg-success" role="progressbar" style="width: ${(objectif.compteur * 100) / objectif.max}%"></div>
                                </div>
                            ` : ''}
                        </div>`;
            }
        });

        $('#events_objectifs').html(html);
    } else {
        $('#events_objectifs').html('');
    }
}

function timeline() {
    let objectifs = (db.get("events").value()) ? db.get("events").value() : null;
    let months = [ "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Decembre" ];
    let month = null;

    if (objectifs.length > 0) {
        let html = '';

        objectifs.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date) || a.categorie.localeCompare(b.categorie) || a.perso.localeCompare(b.perso);
        });

        objectifs.forEach(function (objectif, i) {
            if (objectif.statut == 'done') {
                let objectif_month = months[new Date(objectif.date).getMonth()];
            
                if (!month || month != objectif_month) {
                    month = objectif_month;
                    html += `<div class="card-timeline" style="display: flex;justify-content: center;flex-direction: column;background-color: #444444;text-align: center;position: sticky; top: 0;font-size: 24px;"><span><i class="fa-regular fa-calendar"></i> ${month}</span></div>`;
                }

                html += `<div class="card-timeline" style="display: flex;justify-content: center;flex-direction: column;"><span style="color: white;">${objectif.description}</span><span style="color: #a1a1a1;">${objectif.perso} - ${objectif.categorie}</span><span style="color: #a1a1a1;">Accomplis le ${new Date(objectif.date).toLocaleDateString()}</span></div>`;
            }
        });

        $('#timeline_objectifs').html(html);
    } else {
        $('#timeline_objectifs').html('');
    }
}

$(document).on('click mousewheel', '.fa-solid', function (e) {
    e.stopPropagation();

    let id = $(this).data('id');
    let index = db.get("events").value().findIndex((t) => t.description == id);
    let event = db.get("events").value().find((t) => t.description == id);

    if (event) {
        if ($(this).data('prio') == 'up') {
            db.get("events")
                .get(index)
                .get('priority')
                .set(event.priority + 1);
        } else if ($(this).data('prio') == 'down') {
            db.get("events")
                .get(index)
                .get('priority')
                .set(event.priority - 1);
        }

        db.save();
    }

    events();
});

$(document).on('click mousewheel', '.objectif_todo', function (e) {
    let id = $(this).data('id');
    let index = db.get("events").value().findIndex((t) => t.description == id);
    let event = db.get("events").value().find((t) => t.description == id);

    if (event) {
        if (e.which === 1) {
            db.get("events")
                .get(index)
                .get('statut')
                .set('done');
            
            db.get("events")
                .get(index)
                .get('compteur')
                .set(event.max == 0 ? event.compteur + 1 : event.compteur >= event.max ? event.max : event.compteur + 1);
        } else if (e.originalEvent.wheelDelta / 120 > 0) {
            db.get("events")
                .get(index)
                .get('compteur')
                .set(event.max == 0 ? event.compteur + 1 : event.compteur >= event.max ? event.max : event.compteur + 1);
        } else {
            db.get("events")
                .get(index)
                .get('compteur')
                .set(event.compteur > 0 ? event.compteur - 1 : 0);
        }

        db.get("events")
            .get(index)
            .get('date')
            .set(new Date().toString());

        db.save();
    }

    events();
});

function eventsPerso(name, div) {
    let perso = db.get("persos").value().find((t) => t.name == name);
    let html_effets_bracelet = '';

    perso.bracelet.effets.forEach(function (effet, i) {
        html_effets_bracelet += `<span style="font-size: 18px;">${effet.name} ${effet.value}</span>`;
    });

    $(`#${div}-wrapper`).append(`<div class="card-content-perso" style="grid-column: 1 / 7; grid-row: 1 / 2;"><div style="flex: 1;display: flex;justify-content: space-between;flex-direction: row;align-items: center;height: 100%;"><img src="${perso.logo}" /><span>${perso.name}</span><span>${perso.ilevel}</span></div></div>`);
    $(`#${div}-wrapper`).append(`<div class="card-content-perso" style="grid-column: 1 / 7; grid-row: 3 / 4;"><div style="flex: 1;display: flex;justify-content: space-between;flex-direction: row;align-items: center;height: 100%;"><img src="images/use_11_146.webp" /><span>${perso.elixir.point} Points</span><span>Gain<br>${perso.elixir.gain} %</span></div></div>`);
    $(`#${div}-wrapper`).append(`<div class="card-content-perso" style="grid-column: 1 / 4; grid-row: 2 / 3;"><div style="flex: 1;display: flex;justify-content: space-between;flex-direction: row;align-items: center;height: 100%;"><img src="images/use_9_65.webp" /><span>${perso.gemme.cdr} avg</span></div></div>`);
    $(`#${div}-wrapper`).append(`<div class="card-content-perso" style="grid-column: 4 / 7; grid-row: 2 / 3;"><div style="flex: 1;display: flex;justify-content: space-between;flex-direction: row;align-items: center;height: 100%;"><img src="images/use_9_55.webp" /><span>${perso.gemme.dmg} avg</span></div></div>`);
    $(`#${div}-wrapper`).append(`<div class="card-content-perso" style="grid-column: 7 / 13; grid-row: 1 / 2;"><div style="flex: 1;display: flex;justify-content: space-between;flex-direction: row;align-items: center;height: 100%;"><img src="${perso.gear.weapon.image}" /><span>+${perso.gear.weapon.level}</span><span>Quality ${perso.gear.weapon.quality}</span></div></div>`);
    $(`#${div}-wrapper`).append(`<div class="card-content-perso" style="grid-column: 7 / 13; grid-row: 2 / 3;"><div style="flex: 1;display: flex;justify-content: space-between;flex-direction: row;align-items: center;height: 100%;"><img src="${perso.gear.armor.image}" /><span>Min ${perso.gear.armor.quality.min}</span><span>Avg ${perso.gear.armor.quality.mean}</span></div></div>`);
    $(`#${div}-wrapper`).append(`<div class="card-content-perso" style="grid-column: 1 / 7; grid-row: 4 / 5;"><div style="flex: 1;display: flex;justify-content: space-between;flex-direction: row;align-items: center;height: 100%;"><img src="images/acc_304.webp" /><span>Gain</span><span>${perso.bracelet.gain} %</span></div></div>`);
    $(`#${div}-wrapper`).append(`<div class="card-content-perso" style="grid-column: 7 / 13; grid-row: 3 / 5;"><div style="flex: 1;display: flex;justify-content: center;flex-direction: column;align-items: center;height: 100%;">${html_effets_bracelet}</div></div>`);

}
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------



// -------------------------------------------------------------------------------------------------------------
// --- PLANNING ------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------
function planning() {
    $('.planning-wrapper').html('');

    // Programmed Raids
    $('.planning-wrapper').append(`<div class="card-content" style="grid-column: 1 / 5; grid-row: 1 / 7;"><div id="planning-raids" class="scrollhidden" style="display: flex; flex-direction: column;height: 100%;gap: 10px; overflow-y: scroll;"></div></div>`);

    // Formulaire
    $('.planning-wrapper').append(`<div id="planning_form" class="card-content" style="grid-column: 1 / 5; grid-row: 7 / 11;"></div>`);

    // Calendar
    $('.planning-wrapper').append(`<div class="card-content d-flex align-items-center" style="grid-column: 5 / 17; grid-row: 1 / 11;"><div id="calendar_div" class="flex-grow-1"></div></div>`);

    // Events for calendar
    let events = (db.get("planning.events").value()) ? db.get("planning.events").value() : null;
    let calendarEvents = [];

    events.forEach(function (e, i) {
        calendarEvents.push({
            'id': e.raid,
            'title': { html: `<p style="font-size: 20px;font-family: comfortaa;font-weight: 900;">${e.title}</p>` },
            'titleHTML': e.title,
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
        events: calendarEvents,
        eventClick: function (info) {
            console.log(info)
            console.log(info.event.id)
            console.log(info.event.titleHTML)
            console.log(new Date(info.event.start).toLocaleString())
            console.log(new Date(info.event.end).toLocaleString())

            let infoIndex = db.get("planning.events").value().findIndex((e) => e.raid == info.event.id);
            console.log(infoIndex)

            let start = new Date(info.event.start);
            startyyyy = start.getFullYear();
            startmm = start.getMonth() < 9 ? '0' + (start.getMonth() + 1) : (start.getMonth() + 1);
            startdd = start.getDate() < 10 ? '0' + start.getDate() : start.getDate();
            starthh = start.getHours() < 10 ? '0' + start.getHours() : start.getHours();
            startmin = start.getMinutes() < 10 ? '0' + start.getMinutes() : start.getMinutes();

            let end = new Date(info.event.end);
            endyyyy = end.getFullYear();
            endmm = end.getMonth() < 9 ? '0' + (end.getMonth() + 1) : (end.getMonth() + 1);
            enddd = end.getDate() < 10 ? '0' + end.getDate() : end.getDate();
            endhh = end.getHours() < 10 ? '0' + end.getHours() : end.getHours();
            endmin = end.getMinutes() < 10 ? '0' + end.getMinutes() : end.getMinutes();

            $('#planning_id').val(infoIndex);
            $('#planning_title').val(info.event.titleHTML);
            $('#planning_raid').val(info.event.id);
            $('#planning_start').val(`${startyyyy}-${startmm}-${startdd}T${starthh}:${startmin}`);
            $('#planning_end').val(`${endyyyy}-${endmm}-${enddd}T${endhh}:${endmin}`);
        }
    });

    sidebar_planning();
    planningRaids();
    planningFormulaire();
}

function sidebar_planning() {
    let events = (db.get("planning.events").value()) ? db.get("planning.events").value() : null;
    let done = 0

    events.forEach(function (e, i) {
        if (new Date() > new Date(e.start)) done++;
    });

    let todo = events.length - done;

    todo > 0 ? $('#sidebar-planning-data').html(`<span style="color: #d99157;"><i class="fa-regular fa-clock"></i> ${todo}</span>`) : $('#sidebar-planning-data').html(`<span style="color: #008b2b;"><i class="fa-regular fa-clock"></i> ${todo}</span>`);
}

function planningRaids() {
    let config_raids = db.get("settings.dashboard.liste_raids").value();
    let raids_name_type = [];
    let html_ok = '';
    let html_ko = '';
    let all_done = true;

    $('#planning-raids').html('');

    config_raids.forEach(function (cr, i) {
        raids_name_type.push(cr.name);
    });

    let tasks = db.get("dashboard").value().filter((t) => t.actif == true && raids_name_type.includes(t.type));

    tasks.sort(function (a, b) {
        return a.tache_name - b.tache_name;
    });

    tasks.forEach(function (task, i) {
        let taskrestriction = db.get("dashboard").value().find((t) => t.id == task.restriction);

        if (task.done < task.repet && (task.done > 0 || task.restriction === undefined || (task.restriction !== undefined && taskrestriction.done !== taskrestriction.repet))) {
            all_done = false;

            let event = db.get("planning.events").value().find((t) => t.raid == task.id);
            let config_raid = db.get("settings.dashboard.liste_raids").value().find((cr) => cr.name == task.type);

            if (event) {
                html_ok += `<div class="card-raid" data-id="${task.id}" style="flex: 1;display: flex;justify-content: center;flex-direction: column;"><span style="font-size: 20px;color: ${config_raid.color};">${task.tache_name}</span><span style="font-size: 20px;">${task.perso}</span></div>`;
            } else {
                html_ko += `<div class="card-raid" data-id="${task.id}" style="flex: 1;display: flex;justify-content: center;flex-direction: column;"><span style="font-size: 20px;color: ${config_raid.color};">${task.tache_name}</span><span style="font-size: 20px;">${task.perso}</span></div>`;
            }
        }
    });

    if (!all_done) {
        $('#planning-raids').html(`
            ${html_ok.length > 0 ? `<div class="histo-task" style="flex: 1;display: flex;justify-content: center;flex-direction: column;background-color: #1e1e1e;text-align: center;position: sticky; top: 0;border-radius: 0px;font-size: 24px;"><span><i class="fa-solid fa-arrow-down"></i> Raids Programm&eacute;s <i class="fa-solid fa-arrow-down"></i></span></div>` : ''}
                ${html_ok.length > 0 ? html_ok : ''}
            ${html_ko.length > 0 ? `<div class="histo-task" style="flex: 1;display: flex;justify-content: center;flex-direction: column;background-color: #1e1e1e;text-align: center;position: sticky; top: 0;border-radius: 0px;font-size: 24px;"><span><i class="fa-solid fa-arrow-down"></i> Raids Non Programm&eacute;s <i class="fa-solid fa-arrow-down"></i></span></div>` : ''}
                ${html_ko.length > 0 ? html_ko : ''}
        `);
    } else {
        $('#planning-raids').html(`<div class="histo-task" style="flex: 1;display: flex;justify-content: center;flex-direction: column;background-color: #1e1e1e;text-align: center;position: sticky; top: 0;border-radius: 0px;font-size: 24px;"><span>Raids de la semaine prochaine</span></div>`);

        tasks.forEach(function (task, i) {
            let config_raid = db.get("settings.dashboard.liste_raids").value().find((cr) => cr.name == task.type);

            $('#planning-raids').append(`<div class="card-raid" data-id="${task.id}" style="flex: 1;display: flex;justify-content: center;flex-direction: column;"><span style="font-size: 20px;color: ${config_raid.color};">${task.tache_name}</span><span style="font-size: 20px;">${task.perso}</span></div>`);
        });
    }
}

function planningFormulaire() {
    let raids_name_type = [];
    let html_options_raids = '';
    let html_options_perso = '';

    db.get("settings.dashboard.liste_raids").value().forEach(function (cr, i) {
        raids_name_type.push(cr.name);
    });

    let tasks = db.get("dashboard").value().filter((t) => t.actif == true && raids_name_type.includes(t.type));

    tasks.forEach(function (t, i) {
        html_options_raids += `<option>${t.id}</option>`;
    });

    db.get("persos").value().forEach(function (p, i) {
        html_options_perso += `<option>${p.name}</option>`;
    });

    $('#planning_form').html(`
        <div style="text-align: center;">Formulaire</div><br>
        <div class="d-flex flex-column justify-content-center flex-nowrap gap-3" style="padding: 5px;">
            <input id="planning_id" type="hidden">

            <input id="planning_title" class="form-control flex-grow-1"
                style="background-color: #202020;color: white;" placeholder="Title">

            <input list="planning_raids_list" class="form-control flex-grow-1" id="planning_raid"
                style="background-color: #202020;color: white;" placeholder="Raids">

            <datalist id="planning_raids_list">
                ${html_options_raids}
            </datalist>

            <input id="planning_start" type="datetime-local" class="form-control flex-grow-1"
                style="background-color: #202020;color: white;" placeholder="">

            <input id="planning_end" type="datetime-local" class="form-control flex-grow-1"
                style="background-color: #202020;color: white;" placeholder="">

            <span class="d-flex gap-2">
                <button id="update_planning" type="button" class="btn btn-outline-light flex-grow-1">Ajouter / Modifier</button>
                <button id="remove_planning" type="button" class="btn btn-outline-danger flex-shrink-1"><i class="fa-solid fa-xmark"></i></button>
            </span>
        </div>
    `);
}

$(document).on('click', '.card-raid', function () {
    console.log($(this).data('id'));

    let task = db.get("dashboard").value().find((t) => t.id == $(this).data('id'));
    let info = db.get("planning.events").value().find((e) => e.raid == $(this).data('id'));
    let infoIndex = db.get("planning.events").value().findIndex((e) => e.raid == $(this).data('id'));

    console.log(task)
    console.log(info)

    $('#planning_raid').val(task.id);
    $('#planning_id').val(-1);

    if (info) {
        let start = new Date(info.start);
        startyyyy = start.getFullYear();
        startmm = start.getMonth() < 9 ? '0' + (start.getMonth() + 1) : (start.getMonth() + 1);
        startdd = start.getDate() < 10 ? '0' + start.getDate() : start.getDate();
        starthh = start.getHours() < 10 ? '0' + start.getHours() : start.getHours();
        startmin = start.getMinutes() < 10 ? '0' + start.getMinutes() : start.getMinutes();

        let end = new Date(info.end);
        endyyyy = end.getFullYear();
        endmm = end.getMonth() < 9 ? '0' + (end.getMonth() + 1) : (end.getMonth() + 1);
        enddd = end.getDate() < 10 ? '0' + end.getDate() : end.getDate();
        endhh = end.getHours() < 10 ? '0' + end.getHours() : end.getHours();
        endmin = end.getMinutes() < 10 ? '0' + end.getMinutes() : end.getMinutes();

        $('#planning_id').val(infoIndex);
        $('#planning_title').val(info.title);
        $('#planning_start').val(`${startyyyy}-${startmm}-${startdd}T${starthh}:${startmin}`);
        $('#planning_end').val(`${endyyyy}-${endmm}-${enddd}T${endhh}:${endmin}`);
    } else {
        $('#planning_title').val(`${task.tache_name}<br>${task.perso}`);
    }
});

$(document).on('click', '#update_planning', function () {
    let index = parseInt($('#planning_id').val());
    let title = $('#planning_title').val();
    let raid = $('#planning_raid').val();
    let start = $('#planning_start').val();
    let end = $('#planning_end').val();
    let task = db.get("dashboard").value().find((t) => t.id == raid);
    let textColor = db.get("settings.dashboard.liste_raids").value().find((r) => r.name == task.type).color;
    let backgroundColor = '#444444';

    if (index >= 0) {
        db.get("planning.events")
            .get(index)
            .get('id')
            .set(raid);

        db.get("planning.events")
            .get(index)
            .get('raid')
            .set(raid);

        db.get("planning.events")
            .get(index)
            .get('title')
            .set(title);

        db.get("planning.events")
            .get(index)
            .get('start')
            .set(start);

        db.get("planning.events")
            .get(index)
            .get('end')
            .set(end);

        db.get("planning.events")
            .get(index)
            .get('backgroundColor')
            .set(backgroundColor);

        db.get("planning.events")
            .get(index)
            .get('textColor')
            .set(textColor);

        db.save();
    } else {
        let event = {
            id: raid,
            raid: raid,
            title: title,
            start: start,
            end: end,
            backgroundColor: backgroundColor,
            textColor: textColor
        }

        db.get("planning.events").push(event).save();
    }

    planning();
});

$(document).on('click', '#remove_planning', function () {
    let index = parseInt($('#planning_id').val());

    if (index >= 0) {
        db.get("planning.events")
            .get(index)
            .delete(true);

        db.save();
    }

    planning();
});
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