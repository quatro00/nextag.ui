import { Routes } from '@angular/router';

const routes: Routes = [

    {
        path: '',

        loadComponent: () =>
            import(
                './features/contratos-list/contratos-list'
            ),
    },

];

export default routes;