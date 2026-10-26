/*
 * Cookie Clicker - Cursor Fingers Only
 * Makes Thousand fingers and its upgrades scale with
 * Cursors owned instead of non-Cursor buildings.
 */

(function () {
    'use strict';

    if (typeof Game === 'undefined' ||
        typeof Game.registerMod !== 'function') return;

    if (Game.mods && Game.mods.CursorFingersOnly) return;

    Game.registerMod('CursorFingersOnly', {
        init: function () {
            const cursor = Game.Objects['Cursor'];

            if (!cursor ||
                typeof cursor.cps !== 'function' ||
                typeof Game.mouseCps !== 'function' ||
                typeof Game.ComputeCps !== 'function') {
                console.error(
                    'Cursor Fingers Only: could not find Cookie Clicker functions.'
                );
                return;
            }

            // Preserve all vanilla finger upgrade multipliers.
            const multipliers = [
                ['Million fingers', 5],
                ['Billion fingers', 10],
                ['Trillion fingers', 20],
                ['Quadrillion fingers', 20],
                ['Quintillion fingers', 20],
                ['Sextillion fingers', 20],
                ['Septillion fingers', 20],
                ['Octillion fingers', 20],
                ['Nonillion fingers', 20],
                ['Decillion fingers', 20],
                ['Undecillion fingers', 20],
                ['Unshackled cursors', 25]
            ];

            function fingerBonusPerBuilding() {
                if (!Game.Has('Thousand fingers')) return 0;

                let bonus = 0.1;

                for (const [name, factor] of multipliers) {
                    if (Game.Has(name)) bonus *= factor;
                }

                return bonus;
            }

            // Calculate the difference between the new and
            // original number of buildings contributing.
            function bonusCorrection() {
                let nonCursorCount = 0;

                for (const building of Game.ObjectsById) {
                    if (building !== cursor) {
                        nonCursorCount += building.amount;
                    }
                }

                return fingerBonusPerBuilding() *
                    (cursor.amount - nonCursorCount);
            }

            // Use the original calculation, but replace only
            // the finger bonus before other multipliers apply.
            function changeFingerCount(original, baseValue) {
                return function () {
                    const correction = bonusCorrection();

                    if (correction === 0) {
                        return original.apply(this, arguments);
                    }

                    const savedComputeCps = Game.ComputeCps;
                    let adjusted = false;

                    Game.ComputeCps = function (base, upgrades, bonus) {
                        if (!adjusted && base === baseValue) {
                            adjusted = true;

                            return savedComputeCps.call(
                                this,
                                base,
                                upgrades,
                                (bonus || 0) + correction
                            );
                        }

                        return savedComputeCps.apply(this, arguments);
                    };

                    try {
                        return original.apply(this, arguments);
                    } finally {
                        Game.ComputeCps = savedComputeCps;
                    }
                };
            }

            // Change Cursor building production.
            cursor.cps = changeFingerCount(cursor.cps, 0.1);

            // Change manual clicking production.
            Game.mouseCps = changeFingerCount(Game.mouseCps, 1);

            // Update the Thousand fingers upgrade description.
            const upgrade = Game.Upgrades['Thousand fingers'];

            if (upgrade) {
                const replaceCount = text =>
                    text.replace(
                        /non-cursor (buildings?|objects?)/gi,
                        'Cursor'
                    );

                if (typeof upgrade.desc === 'string') {
                    upgrade.desc = replaceCount(upgrade.desc);
                }

                if (typeof upgrade.baseDesc === 'string') {
                    upgrade.baseDesc = replaceCount(upgrade.baseDesc);
                }
            }

            // Immediately update cookie production.
            Game.recalculateGains = 1;

            Game.Notify(
                'Cursor Fingers Only',
                'Finger upgrades now scale with Cursors owned.',
                [0, 13]
            );
        }
    });
})();
