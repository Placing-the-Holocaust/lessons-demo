---
layout: transcripts
---

{% for transcript in collections.transcripts %}
  <div class="project-card">
    <a class="fade" href="{{ transcript.url }}">
      <div class="stack">
        <div>
          <h2>{{ transcript.data.interviewee }}</h2>
        </div>
      </div>
    </a>
  </div>
{% endfor %}