import sys
filepath = 'artifacts/omega-dashboard/src/pages/Staff.tsx'
old_text = 'const filtered = employees.filter(e =>\n    e.name.toLowerCase().includes(search.toLowerCase()) ||\n    e.department.toLowerCase().includes(search.toLowerCase()) ||\n    e.role.toLowerCase().includes(search.toLowerCase())\n  );'
new_text = '''const filtered = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase());
    const matchesSite = siteFilter === "All Sites" || e.currentSite === siteFilter;
    return matchesSearch && matchesSite;
  });'''
with open(filepath, 'r') as f: content = f.read()
if old_text in content:
    with open(filepath, 'w') as f: f.write(content.replace(old_text, new_text))
    print('Updated')
else:
    print('Failed to find old text')
