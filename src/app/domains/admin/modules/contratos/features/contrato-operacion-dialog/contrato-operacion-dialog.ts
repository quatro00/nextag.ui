import {
    Component,
    inject,
} from '@angular/core';

import {
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';

import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import {
    ContratoOperacionDialogData,
    ContratoOperacionDialogResult,
} from '../../types/contrato-operacion.types';

import {
    CONTRATOS_CONFIG,
} from '../../constants/contratos.constants';

@Component({
    selector: 'app-contrato-operacion-dialog',

    templateUrl: './contrato-operacion-dialog.html',

    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
    ],
})
export default class ContratoOperacionDialog {

    protected readonly data =
        inject<ContratoOperacionDialogData>(
            MAT_DIALOG_DATA
        );

    private readonly dialogRef =
        inject(
            MatDialogRef<
                ContratoOperacionDialog,
                ContratoOperacionDialogResult
            >
        );

    private readonly fb =
        inject(FormBuilder);

    protected readonly maxMotivo =
        CONTRATOS_CONFIG.MAX_MOTIVO_CANCELACION;

    protected readonly form =
        this.fb.nonNullable.group({

            motivo: [
                '',
                this.data.requiereMotivo
                    ? [
                        Validators.required,
                        Validators.maxLength(
                            this.maxMotivo
                        ),
                        Validators.pattern(/\S/),
                    ]
                    : [],
            ],

        });

    protected cancelar(): void {

        this.dialogRef.close({

            confirmado: false,

            motivo: null,

        });
    }

    protected confirmar(): void {

        if (this.form.invalid) {

            this.form.markAllAsTouched();

            return;
        }

        const motivo =
            this.form.controls.motivo.value.trim();

        if (
            this.data.requiereMotivo &&
            !motivo
        ) {

            this.form.controls.motivo.setErrors({
                required: true,
            });

            this.form.markAllAsTouched();

            return;
        }

        this.dialogRef.close({

            confirmado: true,

            motivo:
                this.data.requiereMotivo
                    ? motivo
                    : null,

        });
    }
}