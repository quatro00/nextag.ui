import { Tree, TreeItem, TreeItemGroup } from '@angular/aria/tree';
import { CdkMonitorFocus } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import {
  isActive,
  IsActiveMatchOptions,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter } from 'rxjs';
import {
  NAVIGATION,
  NavigationItem,
} from '@/app/domains/admin/layout/data/navigation';
import { AuthService } from '@/app/domains/auth/services/auth.services';

@Component({
  selector: 'navigation',
  imports: [
    MatIcon,
    NgTemplateOutlet,
    RouterLinkActive,
    Tree,
    TreeItem,
    TreeItemGroup,
    RouterLink,
    CdkMonitorFocus,
  ],
  template: `
    <div class="flex flex-col gap-y-4">
      @for (section of navigation(); track section.id) {
        <div class="flex flex-col px-4">

          <!-- Section title -->
          <div class="px-2.5 py-1.5 text-sm font-semibold text-blue-400">
            {{ section.label }}

            <!-- Section description -->
            @if (section.description) {
              <div class="text-xs font-medium text-neutral-400">
                {{ section.description }}
              </div>
            }
          </div>

          <!-- Section content -->
          <ul
            ngTree
            class="mt-1 flex flex-col gap-y-1"
            [nav]="true"
            #tree="ngTree"
          >
            <ng-template
              [ngTemplateOutlet]="treeNodes"
              [ngTemplateOutletContext]="{
                nodes: section.children,
                parent: tree,
              }"
            />
          </ul>

          <!-- Menu item -->
          <ng-template
            let-nodes="nodes"
            let-parent="parent"
            #treeNodes
          >
            @for (node of nodes; track node.id) {
              <a
                cdkMonitorElementFocus
                ngTreeItem
                routerLinkActive="bg-neutral-700/10 dark:bg-neutral-300/10"
                class="navigation-item flex cursor-pointer items-center gap-x-2 rounded-lg px-2.5 py-2 select-none hover:bg-neutral-700/10 dark:hover:bg-neutral-300/10"
                [parent]="parent"
                [value]="node.id"
                [label]="node.label"
                [disabled]="node.disabled"
                [selectable]="!node.children"
                [(expanded)]="node.expanded"
                [routerLink]="node.route"
                [routerLinkActiveOptions]="
                  node.activeOptions ?? { exact: true }
                "
                (click)="$event.preventDefault()"
                #treeItem="ngTreeItem"
              >
                <!-- Icon -->
                @if (node.icon) {
                  <mat-icon
                    class="pointer-events-none size-4"
                    [svgIcon]="node.icon"
                  />
                }

                <!-- Label -->
                <div class="flex flex-auto flex-col font-medium">
                  {{ node.label }}

                  <!-- Description -->
                  @if (node.description) {
                    <div class="text-xs">
                      {{ node.description }}
                    </div>
                  }
                </div>

                <!-- Badge -->
                @if (node.badge) {
                  <div
                    class="rounded bg-pink-400 px-1.5 py-0.5 text-xs font-semibold dark:bg-pink-700"
                  >
                    {{ node.badge }}
                  </div>
                }

                <!-- Expand icon -->
                @if (node.children && node.children.length > 0) {
                  <mat-icon
                    svgIcon="chevron-right"
                    class="pointer-events-none size-4 transition-[rotate]"
                    [class.rotate-90]="node.expanded"
                  />
                }
              </a>

              <!-- Children -->
              @if (node.children && node.children.length > 0) {
                <ul
                  class="flex flex-col gap-y-1 [&_ul>.navigation-item]:pl-14.5 [&>.navigation-item]:pl-8.5"
                  [class.hidden]="!node.expanded"
                  [class.mt-1]="node.expanded"
                  role="group"
                >
                  <ng-template
                    ngTreeItemGroup
                    [ownedBy]="treeItem"
                    #group="ngTreeItemGroup"
                  >
                    <ng-template
                      [ngTemplateOutlet]="treeNodes"
                      [ngTemplateOutletContext]="{
                        nodes: node.children,
                        parent: group,
                      }"
                    />
                  </ng-template>
                </ul>
              }
            }
          </ng-template>
        </div>
      }
    </div>
  `,
})
export class Navigation {
  private router = inject(Router);
  private authService = inject(AuthService);

  protected navigationEnd = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    )
  );

  protected navigation = computed(() => {
    const items = this.filterNavigation(NAVIGATION);

    const navigationEnd = this.navigationEnd();

    if (!navigationEnd) {
      return items;
    }

    return this.expandActiveRoute(items);
  });

  /**
   * Filtra el menú de acuerdo con los roles
   * del usuario autenticado.
   */
  private filterNavigation(
    items: NavigationItem[]
  ): NavigationItem[] {
    return items.flatMap((item) => {
      if (
        item.roles?.length &&
        !this.authService.hasAnyRole(item.roles)
      ) {
        return [];
      }

      const children = item.children
        ? this.filterNavigation(item.children)
        : undefined;

      // Si es únicamente una sección/contenedor y después
      // de filtrar ya no tiene hijos, tampoco se muestra.
      if (
        item.children &&
        !children?.length &&
        !item.route
      ) {
        return [];
      }

      return [
        {
          ...item,
          children,
        },
      ];
    });
  }

  /**
   * Expande automáticamente los padres
   * de la ruta actualmente activa.
   */
  private expandActiveRoute(
    items: NavigationItem[]
  ): NavigationItem[] {
    return items.map((item) => {
      const current: NavigationItem = {
        ...item,
      };

      if (current.children?.length) {
        current.children = this.expandActiveRoute(
          current.children
        );

        if (
          current.children.some(
            (child) => child.expanded
          )
        ) {
          current.expanded = true;
        }
      }

      if (
        current.route &&
        isActive(
          current.route,
          this.router,
          this.isActiveOption(
            current.activeOptions ?? {
              exact: true,
            }
          )
        )()
      ) {
        current.expanded = true;
      }

      return current;
    });
  }

  /**
   * Convierte la configuración simple de exact
   * al formato completo de Angular Router.
   */
  private isActiveOption(
    options:
      | { exact: boolean }
      | IsActiveMatchOptions
  ): IsActiveMatchOptions {
    if ('exact' in options) {
      return options.exact
        ? {
            paths: 'exact',
            queryParams: 'exact',
            fragment: 'ignored',
            matrixParams: 'ignored',
          }
        : {
            paths: 'subset',
            queryParams: 'subset',
            fragment: 'ignored',
            matrixParams: 'ignored',
          };
    }

    return options;
  }
}