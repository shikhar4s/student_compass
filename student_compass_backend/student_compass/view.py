from django.shortcuts import render


def render_react_app(request):
    return render(request, 'index.html')