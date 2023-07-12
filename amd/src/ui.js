/* eslint-disable no-undef */
/* eslint-disable no-console */
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

import CodeProModal from "./modal";
import ModalFactory from 'core/modal_factory';
import ModalEvents from 'core/modal_events';
import {baseUrl} from './common';

/**
 * Tiny CodePro plugin.
 *
 * @module      tiny_codepro/plugin
 * @copyright   2023 Josep Mulet Pol <pmulet@iedib.net>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

let modal = null;
let codeEditorInstance = null;

/**
 * Handle action
 * @param {TinyMCE} editor
 */
export const handleAction = (editor) => {
    console.log("handleAction");
    if (modal === null) {
        console.log("createDialogue");
        createDialogue(editor);
    } else {
        console.log("Showing dialogue");
        modal.show();
        codeEditorInstance.setValue(editor);
    }
};

const createDialogue = async (editor) => {
    console.log("createDialogue....");
    const elementid = "codepro_editorroot";
    const data = {
        elementid: elementid
    };

    // Show modal with buttons.
    modal = await ModalFactory.create({
        type: CodeProModal.TYPE,
        templateContext: data,
        large: true,
    });

    // Load cm6 on demand
    require.config({
        paths: {
            cm6: baseUrl + '/vendor/codemirror6/dist/cm6-lazy.min'
        }
    });
    require(['cm6'], (CodeProEditor) => {
        console.log("cm6 loaded: ", CodeProEditor);
        // Setting themes
        const themeSelector = modal.footer.find("select");
        modal.getRoot().find(".modal-dialog.modal-lg").css("max-width", "90%");
        // Disable ESC key on this modal
        modal.getRoot().off('keydown');

        const targetElem = modal.body.find('#' + elementid)[0];

        codeEditorInstance = new CodeProEditor(targetElem);
        themeSelector.on("change", (evt) => {
            codeEditorInstance.setTheme(evt.target.value);
        });
        modal.footer.find("button.btn[data-action]").on("click", (evt) => {
            if (evt.target.classList.contains("btn-primary")) {
                codeEditorInstance.updateContent();
            }
            modal.hide();
            codeEditorInstance.setValue();
        });
        modal.footer.find("button.btn.btn-light").on("click", (evt) => {
            evt.preventDefault();
            const ds = evt.currentTarget.dataset;
            const icon = evt.currentTarget.querySelector("i.fa");
            if (ds.fs) {
                if (ds.fs === "false") {
                    // Go to FS
                    ds.fs = "true";
                    modal.header.hide();
                    modal.getRoot().find('[role="document"]').removeClass("modal-dialog modal-lg modal-dialog-scrollable");
                    modal.getRoot().find('[role="document"]').addClass("tiny_codepro-fullscreen");
                } else {
                    // Return to modal
                    ds.fs = "false";
                    modal.header.show();
                    modal.getRoot().find('[role="document"]').removeClass("tiny_codepro-fullscreen");
                    modal.getRoot().find('[role="document"]').addClass("modal-dialog modal-lg modal-dialog-scrollable");
                }
            } else if (ds.theme) {
                if (ds.theme === "light") {
                    ds.theme = "dark";
                    icon.classList.remove("fa-sun-o");
                    icon.classList.add("fa-moon-o");
                    codeEditorInstance.setTheme("dark");
                    modal.getRoot().find('[role="document"]').addClass("tiny_codepro-dark");
                } else {
                    ds.theme = "light";
                    icon.classList.remove("fa-moon-o");
                    icon.classList.add("fa-sun-o");
                    codeEditorInstance.setTheme("light");
                    modal.getRoot().find('[role="document"]').removeClass("tiny_codepro-dark");
                }
            } else if (ds.wrap) {
                if (ds.wrap === "true") {
                    ds.wrap = false;
                    codeEditorInstance.setLineWrapping(false);
                    icon.classList.remove("fa-exchange");
                    icon.classList.add("fa-long-arrow-right");
                } else {
                    ds.wrap = true;
                    codeEditorInstance.setLineWrapping(true);
                    icon.classList.add("fa-exchange");
                    icon.classList.remove("fa-long-arrow-right");
                }
            }
        });
        modal.getRoot().on(ModalEvents.hidden, () => {
            codeEditorInstance.setValue();
        });

        console.log("setting and showing");
        modal.show();
        codeEditorInstance.setValue(editor);
    });
};