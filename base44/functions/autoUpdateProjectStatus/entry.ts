import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Get today's date in Amsterdam timezone
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
  today.setHours(0, 0, 0, 0);

  // Fetch all projects with status geboekt or shoot_uitgevoerd
  const projects = await base44.asServiceRole.entities.Project.list();

  const toUpdate = projects.filter(p => {
    if (!p.shoot_date) return false;
    if (p.status !== 'geboekt' && p.status !== 'shoot_uitgevoerd') return false;

    const shootDate = new Date(p.shoot_date);
    shootDate.setHours(0, 0, 0, 0);

    // Update if shoot date is in the past (before today)
    return shootDate < today;
  });

  let updated = 0;
  for (const project of toUpdate) {
    await base44.asServiceRole.entities.Project.update(project.id, {
      status: 'wordt_bewerkt',
    });
    updated++;
  }

  return Response.json({ updated, message: `${updated} project(en) bijgewerkt naar 'wordt_bewerkt'` });
});