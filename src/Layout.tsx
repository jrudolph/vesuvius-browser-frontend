import React from "react";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/" className="font-bold">
                  Vesuvius Challenge Segment Browser
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <a href="/api/docs" className="px-3 py-2">
                  API
                </a>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <a href="/license" className="px-3 py-2">
                  License
                </a>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <a href="/blog" className="px-3 py-2">
                  Blog / Work Log
                </a>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/jrudolph/vesuvius-gui"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">{children}</main>

      <footer className="border-t py-6 text-sm text-muted-foreground">
        <div className="container mx-auto px-4 space-y-2">
          <div>
            <a
              href="https://scrollprize.org/data_segments"
              className="hover:underline"
            >
              Vesuvius Challenge
            </a>{" "}
            segment browser by{" "}
            <a href="https://virtual-void.net" className="hover:underline">
              Johannes Rudolph
            </a>
          </div>
          <div>
            All EduceLab-Scrolls data is copyrighted by EduceLab/The University
            of Kentucky.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
