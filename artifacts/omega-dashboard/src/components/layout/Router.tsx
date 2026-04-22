import React from 'react';
import { Switch, Route } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Staff from "@/pages/Staff";
import Documents from "@/pages/Documents";
import Import from "@/pages/Import";
import NotFound from "@/pages/not-found";

export function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/projects" component={Projects} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/staff" component={Staff} />
        <Route path="/documents" component={Documents} />
        <Route path="/import" component={Import} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}
