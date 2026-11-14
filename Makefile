.PHONY: setup health test train train-nn evaluate inspect clean demo-m2a demo-m2b run run-api run-web test-web build-web test-all

setup:
	bash scripts/setup.sh

health:
	source venv/bin/activate && python3 scripts/health_check.py

test:
	source venv/bin/activate && pytest -v tests/

inspect:
	source venv/bin/activate && python3 scripts/inspect_dataset.py

train:
	source venv/bin/activate && python3 scripts/train_p300.py

train-nn:
	source venv/bin/activate && python3 scripts/train_nn.py

evaluate:
	source venv/bin/activate && python3 scripts/evaluate_p300.py

demo-m2a:
	source venv/bin/activate && python3 scripts/demo_m2a_replay.py

demo-m2b:
	source venv/bin/activate && python3 scripts/demo_m2b_speller.py

run:
	bash scripts/run.sh

run-api:
	source venv/bin/activate && uvicorn apps.api.app.main:app --host 0.0.0.0 --port 8000 --reload

run-web:
	cd apps/web && npm run dev -- --host 0.0.0.0 --port 3000

test-web:
	cd apps/web && npm test

build-web:
	cd apps/web && npm run build

test-all:
	source venv/bin/activate && pytest -v tests/
	cd apps/web && npm test

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
