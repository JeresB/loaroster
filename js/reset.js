function reset() {
    let reload = false;

    // Reset quotidien
    if (db.get('resetDaily').value() != moment().format('DD/MM/YYYY') && moment().format("HH") > 10) {
        db.get('resetDaily').set(moment().format('DD/MM/YYYY'));
        db.save();

        db.get("dashboard").value().forEach(function (task, i) {
            if (task.reset == 'daily') {
                if (task.rested) {
                    let notdone = parseInt(task.repet) - parseInt(task.done);
                    let newrest = parseInt(task.rest) + (notdone * 10);
                    if (newrest > 100) newrest = 100;

                    if (notdone > 0) {
                        db.get("dashboard")
                            .get(i)
                            .get('rest')
                            .set(newrest);
                    }
                }

                db.get("dashboard")
                    .get(i)
                    .get('done')
                    .set(0);

                db.save();
            }
        });

        reload = true;
    }

    // Reset weekly
    if (db.get('resetWeekly').value() != moment().format('DD/MM/YYYY') && moment().format('E') == 3 && moment().format("HH") > 10) {
        db.get('resetWeekly').set(moment().format('DD/MM/YYYY'));
        db.save();

        db.get("dashboard").value().forEach(function (task, i) {
            if (task.reset == 'weekly') {
                db.get("dashboard")
                    .get(i)
                    .get('done')
                    .set(0);

                db.save();
            }
        });

        db.get("gemmes.all").push({ 'date': new Date(), 'label': new Date().toLocaleString(), 'gemmes': db.get("gemmes.week").value() }).save();

        db.get("gemmes.week").set(0);
        db.save();

        db.get("gold_histo").push({ 'date': new Date(), 'label': new Date().toLocaleString(), 'gold': db.get("gold").value() }).save();

        reload = true;
    }

    // Reset Bi Mensuel
    let a = moment(db.get('resetBiMensuel').value(), 'DD/MM/YYYY');
    let b = moment();

    if (db.get('resetBiMensuel').value() != moment().format('DD/MM/YYYY') && moment().format('E') == 3 && moment().format("HH") > 10 && b.diff(a, 'days') > 10) {
        db.get('resetBiMensuel').set(moment().format('DD/MM/YYYY'));
        db.save();

        db.get("dashboard").value().forEach(function (task, i) {
            if (task.reset == 'bimensuel') {
                db.get("dashboard")
                    .get(i)
                    .get('done')
                    .set(0);

                db.save();
            }
        });

        reload = true;
    }

    if (reload) {
        window.location.reload();
    }
}

function forceResetDaily() {
    db.get('resetDaily').set(moment().format('DD/MM/YYYY'));
    db.save();

    db.get("dashboard").value().forEach(function (task, i) {
        if (task.reset == 'daily') {
            if (task.rested) {
                let notdone = parseInt(task.repet) - parseInt(task.done);
                let newrest = parseInt(task.rest) + (notdone * 10);
                if (newrest > 100) newrest = 100;

                if (notdone > 0) {
                    db.get("dashboard")
                        .get(i)
                        .get('rest')
                        .set(newrest);
                }
            }

            db.get("dashboard")
                .get(i)
                .get('done')
                .set(0);

            db.save();
        }
    });

    window.location.reload();
}

function forceResetWeekly() {
    db.get('resetWeekly').set(moment().format('DD/MM/YYYY'));
    db.save();

    db.get("dashboard").value().forEach(function (task, i) {
        if (task.reset == 'weekly') {
            db.get("dashboard")
                .get(i)
                .get('done')
                .set(0);

            db.save();
        }
    });

    db.get("gemmes.week").set(0);
    db.save();

    window.location.reload();
}