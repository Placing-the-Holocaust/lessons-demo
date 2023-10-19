---
layout: transcripts
---

{% for transcript in collections.transcripts %}
  <div class="project-card">
    <a class="fade" href="{{ transcript.url }}">
      <div class="stack">
        <div class="project-card-thumb">
          {% if transcript.data.image %}
            <img src="{{ transcript.url }}/{{ transcript.data.image }}" />
          {% endif %}
        </div>
        <div>
          <h2>{{ transcript.data.interviewee }}</h2>
        </div>
      </div>
    </a>
  </div>
{% endfor %}